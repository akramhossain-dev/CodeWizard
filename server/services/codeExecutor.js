import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ── Docker availability check (done once at startup) ──────────────────────────
let DOCKER_AVAILABLE = false;
const ALLOW_UNSAFE_LOCAL_EXECUTION = process.env.ALLOW_UNSAFE_LOCAL_EXECUTION === 'true';
try {
    const { execSync } = await import('child_process');
    execSync('docker info', { stdio: 'ignore', timeout: 3000 });
    DOCKER_AVAILABLE = true;
    console.log('🐳 Docker available — using sandboxed execution');
} catch {
    DOCKER_AVAILABLE = false;
    if (ALLOW_UNSAFE_LOCAL_EXECUTION) {
        console.warn('⚠️  Docker not available — using direct local execution (unsafe mode)');
    } else {
        console.error('❌ Docker not available — judge execution is disabled for security');
    }
}

const JUDGE_MIN_TIME_MS = 100;
const JUDGE_MAX_TIME_MS = 15000;
const JUDGE_MIN_MEMORY_MB = 64;
const JUDGE_MAX_MEMORY_MB = 1024;

// Minimum memory required per language (runtime overhead)
const LANG_MIN_MEMORY = {
    javascript: 128,
    python:      64,
    cpp:         64,
    c:           64,
    java:       256
};

// Language configurations
const LANGUAGE_CONFIG = {
    javascript: {
        image: 'node:18-alpine',
        extension: 'js',
        compileCmd: null,
        localCompileCmd: null,
        runCmd: (file) => `node ${file}`,
        localRunCmd: (file, dir) => ({ cmd: 'node', args: [path.join(dir, file)] }),
        timeout: 10
    },
    python: {
        image: 'python:3.11-alpine',
        extension: 'py',
        compileCmd: null,
        localCompileCmd: null,
        runCmd: (file) => `python3 ${file}`,
        localRunCmd: (file, dir) => ({ cmd: 'python3', args: [path.join(dir, file)] }),
        timeout: 10
    },
    cpp: {
        image: 'gcc:12',
        extension: 'cpp',
        compileCmd: (file, output) => `g++ -O2 -std=c++17 ${file} -o ${output}`,
        localCompileCmd: (file, output, dir) => ({
            cmd: 'g++', args: ['-O2', '-std=c++17', path.join(dir, file), '-o', path.join(dir, output)]
        }),
        runCmd: (file) => `./${file}`,
        localRunCmd: (file, dir) => ({ cmd: path.join(dir, file), args: [] }),
        timeout: 10
    },
    c: {
        image: 'gcc:12',
        extension: 'c',
        compileCmd: (file, output) => `gcc -O2 ${file} -o ${output}`,
        localCompileCmd: (file, output, dir) => ({
            cmd: 'gcc', args: ['-O2', path.join(dir, file), '-o', path.join(dir, output)]
        }),
        runCmd: (file) => `./${file}`,
        localRunCmd: (file, dir) => ({ cmd: path.join(dir, file), args: [] }),
        timeout: 10
    },
    java: {
        image: 'eclipse-temurin:17-alpine',
        extension: 'java',
        compileCmd: (file) => `javac ${file}`,
        localCompileCmd: (file, _output, dir) => ({
            cmd: 'javac', args: [path.join(dir, file)]
        }),
        runCmd: (className) => `java ${className}`,
        localRunCmd: (className, dir) => ({ cmd: 'java', args: ['-cp', dir, className] }),
        timeout: 10
    }
};

/**
 * Execute user code — uses Docker if available, otherwise runs directly
 */
export async function executeCode({ code, language, testCases, timeLimit, memoryLimit }) {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
        return {
            verdict: 'Compilation Error',
            errorMessage: 'Unsupported language',
            testResults: [],
            passedTestCases: 0,
            totalTestCases: 0
        };
    }
    if (!DOCKER_AVAILABLE && !ALLOW_UNSAFE_LOCAL_EXECUTION) {
        return {
            verdict: 'Internal Error',
            errorMessage: 'Judge unavailable. Sandbox is not ready.',
            testResults: [],
            passedTestCases: 0,
            totalTestCases: testCases?.length || 0
        };
    }

    const safeTimeLimit = Math.max(JUDGE_MIN_TIME_MS, Math.min(Number(timeLimit) || 2000, JUDGE_MAX_TIME_MS));
    const baseMemoryLimit = Math.max(JUDGE_MIN_MEMORY_MB, Math.min(Number(memoryLimit) || 256, JUDGE_MAX_MEMORY_MB));

    // Clamp memory: never go below the language's minimum to avoid false OOM on runtime startup
    const minMem = LANG_MIN_MEMORY[language] || 64;
    memoryLimit = Math.max(baseMemoryLimit, minMem);

    const sessionId = crypto.randomBytes(8).toString('hex');
    const workDir = path.join('/tmp', `code-exec-${sessionId}`);
    
    try {
        // Create temp directory
        await fs.mkdir(workDir, { recursive: true });

        // Determine filename
        let filename, executableName, className;
        if (language === 'java') {
            // Extract class name from Java code
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            className = classMatch ? classMatch[1] : 'Main';
            filename = `${className}.${config.extension}`;
            executableName = className;
        } else {
            filename = `solution.${config.extension}`;
            executableName = language === 'cpp' || language === 'c' ? 'solution' : filename;
        }

        const filepath = path.join(workDir, filename);
        
        // Write code to file
        await fs.writeFile(filepath, code);

        // Compilation step (if needed)
        let compilationOutput = '';
        if (config.compileCmd) {
            try {
                if (DOCKER_AVAILABLE) {
                    const compileCommand = config.compileCmd(filename, executableName);
                    const dockerCompile = `docker run --rm \
                        --network none \
                        --memory=${memoryLimit}m \
                        --cpus=1 \
                        --pids-limit=50 \
                        --ulimit nofile=100:100 \
                        --ulimit nproc=50:50 \
                        -v ${workDir}:/workspace:rw \
                        -w /workspace \
                        ${config.image} \
                        sh -c "${compileCommand}"`;
                    const { stdout, stderr } = await execAsync(dockerCompile, { timeout: 15000, maxBuffer: 1024 * 1024 });
                    compilationOutput = stdout + stderr;
                } else {
                    // Direct local compilation
                    const { cmd, args } = config.localCompileCmd(filename, executableName, workDir);
                    const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: 15000, maxBuffer: 1024 * 1024 });
                    compilationOutput = stdout + stderr;
                }
                console.log('✅ Compilation successful');

            } catch (error) {
                console.error('❌ Compilation failed:', error.stderr || error.message);
                await cleanup(workDir);
                return {
                    verdict: 'Compilation Error',
                    errorMessage: error.stderr || error.message,
                    compilationOutput: error.stderr || error.message,
                    testResults: [],
                    passedTestCases: 0,
                    totalTestCases: testCases.length
                };
            }
        }

        // Run test cases
        const testResults = [];
        let passedCount = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let verdict = 'Accepted';
        let errorMessage = '';

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const startTime = Date.now();

            try {
                let stdout, stderr;

                if (DOCKER_AVAILABLE) {
                    const runCommand = config.runCmd(executableName);
                    const dockerRun = `docker run --rm \
                        --network none \
                        --memory=${memoryLimit}m \
                        --memory-swap=${memoryLimit}m \
                        --cpus=1 \
                        --pids-limit=50 \
                        --ulimit nofile=100:100 \
                        --ulimit nproc=50:50 \
                        --security-opt=no-new-privileges \
                        --cap-drop=ALL \
                        --read-only \
                        --tmpfs /tmp:rw,noexec,nosuid,size=10m \
                        -v ${workDir}:/workspace:ro \
                        -w /workspace \
                        ${config.image} \
                        timeout ${safeTimeLimit / 1000}s sh -c "echo '${testCase.input.replace(/'/g, "'\\''")}' | ${runCommand}"`;
                    ({ stdout, stderr } = await execAsync(dockerRun, { timeout: safeTimeLimit + 2000, maxBuffer: 1024 * 1024 }));
                } else {
                    // Direct local execution — pipe input via stdin
                    const { cmd, args } = config.localRunCmd(executableName, workDir);
                    ({ stdout, stderr } = await execFileAsync(cmd, args, {
                        input: testCase.input,
                        timeout: safeTimeLimit + 2000,
                        maxBuffer: 1024 * 1024
                    }));
                }

                const executionTime = Date.now() - startTime;
                const actualOutput = stdout.trim();
                const expectedOutput = testCase.expectedOutput.trim();

                // Compare outputs
                const passed = actualOutput === expectedOutput;
                
                if (passed) {
                    passedCount++;
                } else if (verdict === 'Accepted') {
                    verdict = 'Wrong Answer';
                    errorMessage = `Test case ${i + 1} failed`;
                }

                testResults.push({
                    testCaseIndex: i,
                    passed,
                    input: testCase.isHidden ? 'Hidden' : testCase.input,
                    expectedOutput: testCase.isHidden ? 'Hidden' : expectedOutput,
                    actualOutput: testCase.isHidden ? (passed ? 'Correct' : 'Wrong') : actualOutput,
                    executionTime,
                    error: stderr || undefined
                });

                totalRuntime += executionTime;

            } catch (error) {
                const executionTime = Date.now() - startTime;

                // Determine error type
                let testVerdict = 'Runtime Error';
                let testError = error.message;

                if (error.killed || error.signal === 'SIGTERM') {
                    testVerdict = 'Time Limit Exceeded';
                    testError = `Execution exceeded ${safeTimeLimit}ms`;
                    verdict = 'Time Limit Exceeded';
                } else if (error.message.includes('memory') || error.message.includes('OOM')) {
                    testVerdict = 'Memory Limit Exceeded';
                    testError = `Memory exceeded ${memoryLimit}MB`;
                    verdict = 'Memory Limit Exceeded';
                } else {
                    verdict = 'Runtime Error';
                }

                errorMessage = testError;

                testResults.push({
                    testCaseIndex: i,
                    passed: false,
                    input: testCase.isHidden ? 'Hidden' : testCase.input,
                    expectedOutput: testCase.isHidden ? 'Hidden' : testCase.expectedOutput,
                    actualOutput: testCase.isHidden ? 'Error' : '',
                    executionTime,
                    error: testError
                });

                // Stop on first error for certain verdicts
                if (verdict === 'Time Limit Exceeded' || verdict === 'Memory Limit Exceeded') {
                    break;
                }
            }
        }

        // Cleanup
        await cleanup(workDir);

        // Calculate average runtime
        const avgRuntime = testResults.length > 0 ? Math.round(totalRuntime / testResults.length) : 0;

        return {
            verdict,
            runtime: avgRuntime,
            memory: maxMemory || 0,
            testResults,
            passedTestCases: passedCount,
            totalTestCases: testCases.length,
            errorMessage: verdict !== 'Accepted' ? errorMessage : undefined,
            compilationOutput: compilationOutput || undefined
        };

    } catch (error) {
        console.error('Execution error:', error);
        
        // Cleanup on error
        await cleanup(workDir).catch(() => {});

        return {
            verdict: 'Internal Error',
            errorMessage: error.message,
            testResults: [],
            passedTestCases: 0,
            totalTestCases: testCases.length
        };
    }
}

export function isJudgeExecutionAvailable() {
    return DOCKER_AVAILABLE || ALLOW_UNSAFE_LOCAL_EXECUTION;
}

/**
 * Run code without saving to database (for quick single-input testing)
 */
export async function runCodeTest({ code, language, input, timeLimit = 2000, memoryLimit = 256 }) {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
        return { success: false, error: 'Unsupported language' };
    }

    if (!DOCKER_AVAILABLE && !ALLOW_UNSAFE_LOCAL_EXECUTION) {
        return { success: false, error: 'Judge Unavailable', message: 'Sandbox is not ready.' };
    }

    const safeTimeLimit = Math.max(JUDGE_MIN_TIME_MS, Math.min(Number(timeLimit) || 2000, JUDGE_MAX_TIME_MS));
    const baseMemoryLimit = Math.max(JUDGE_MIN_MEMORY_MB, Math.min(Number(memoryLimit) || 256, JUDGE_MAX_MEMORY_MB));
    const minMem = LANG_MIN_MEMORY[language] || 64;
    memoryLimit = Math.max(baseMemoryLimit, minMem);

    const sessionId = crypto.randomBytes(8).toString('hex');
    const workDir = path.join('/tmp', `code-test-${sessionId}`);
    
    try {
        await fs.mkdir(workDir, { recursive: true });

        let filename, executableName, className;
        if (language === 'java') {
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            className = classMatch ? classMatch[1] : 'Main';
            filename = `${className}.${config.extension}`;
            executableName = className;
        } else {
            filename = `solution.${config.extension}`;
            executableName = language === 'cpp' || language === 'c' ? 'solution' : filename;
        }

        await fs.writeFile(path.join(workDir, filename), code);

        // Compilation
        if (config.compileCmd) {
            try {
                if (DOCKER_AVAILABLE) {
                    const compileCommand = config.compileCmd(filename, executableName);
                    await execAsync(
                        `docker run --rm --network none --memory=${memoryLimit}m -v ${workDir}:/workspace:rw -w /workspace ${config.image} sh -c "${compileCommand}"`,
                        { timeout: 15000 }
                    );
                } else {
                    const { cmd, args } = config.localCompileCmd(filename, executableName, workDir);
                    await execFileAsync(cmd, args, { timeout: 15000 });
                }
            } catch (error) {
                await cleanup(workDir);
                return { success: false, error: 'Compilation Error', message: error.stderr || error.message };
            }
        }

        // Run
        const startTime = Date.now();
        let stdout, stderr;
        if (DOCKER_AVAILABLE) {
            const runCommand = config.runCmd(executableName);
            ({ stdout, stderr } = await execAsync(
                `docker run --rm --network none --memory=${memoryLimit}m --cpus=1 -v ${workDir}:/workspace:ro -w /workspace ${config.image} timeout ${safeTimeLimit / 1000}s sh -c "echo '${input.replace(/'/g, "'\\''")}' | ${runCommand}"`,
                { timeout: safeTimeLimit + 2000, maxBuffer: 1024 * 1024 }
            ));
        } else {
            const { cmd, args } = config.localRunCmd(executableName, workDir);
            ({ stdout, stderr } = await execFileAsync(cmd, args, {
                input,
                timeout: safeTimeLimit + 2000,
                maxBuffer: 1024 * 1024
            }));
        }

        await cleanup(workDir);
        return { success: true, output: stdout, error: stderr || undefined, executionTime: Date.now() - startTime };

    } catch (error) {
        await cleanup(workDir).catch(() => {});
        if (error.killed || error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT') {
            return { success: false, error: 'Time Limit Exceeded', message: `Execution exceeded ${safeTimeLimit}ms` };
        }
        return { success: false, error: 'Runtime Error', message: error.message };
    }
}

/**
 * Cleanup temporary files
 */
async function cleanup(workDir) {
    try {
        await fs.rm(workDir, { recursive: true, force: true });
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

export default { executeCode, runCodeTest, isJudgeExecutionAvailable };
