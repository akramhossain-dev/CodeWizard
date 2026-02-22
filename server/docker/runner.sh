#!/bin/bash

# Runner script for executing code in Docker sandbox
# Usage: runner.sh <language> <timeout> <memory_limit>

LANGUAGE=$1
TIMEOUT=$2  # in seconds
MEMORY_LIMIT=$3  # in MB

# Files
CODE_FILE="/workspace/code.$LANGUAGE"
INPUT_FILE="/workspace/input.txt"
OUTPUT_FILE="/workspace/output.txt"
ERROR_FILE="/workspace/error.txt"
COMPILE_ERROR_FILE="/workspace/compile_error.txt"

# Compile if needed
case $LANGUAGE in
    java)
        # Compile Java
        javac "$CODE_FILE" 2> "$COMPILE_ERROR_FILE"
        if [ $? -ne 0 ]; then
            cat "$COMPILE_ERROR_FILE"
            exit 2  # Compilation error
        fi
        # Run Java
        timeout "$TIMEOUT" java -Xmx${MEMORY_LIMIT}m -cp /workspace Main < "$INPUT_FILE" > "$OUTPUT_FILE" 2> "$ERROR_FILE"
        EXIT_CODE=$?
        ;;
    
    cpp)
        # Compile C++
        g++ -std=c++17 -O2 "$CODE_FILE" -o /workspace/a.out 2> "$COMPILE_ERROR_FILE"
        if [ $? -ne 0 ]; then
            cat "$COMPILE_ERROR_FILE"
            exit 2  # Compilation error
        fi
        # Run C++
        timeout "$TIMEOUT" /workspace/a.out < "$INPUT_FILE" > "$OUTPUT_FILE" 2> "$ERROR_FILE"
        EXIT_CODE=$?
        ;;
    
    c)
        # Compile C
        gcc -std=c11 -O2 "$CODE_FILE" -o /workspace/a.out 2> "$COMPILE_ERROR_FILE"
        if [ $? -ne 0 ]; then
            cat "$COMPILE_ERROR_FILE"
            exit 2  # Compilation error
        fi
        # Run C
        timeout "$TIMEOUT" /workspace/a.out < "$INPUT_FILE" > "$OUTPUT_FILE" 2> "$ERROR_FILE"
        EXIT_CODE=$?
        ;;
    
    python)
        # Run Python
        timeout "$TIMEOUT" python3 "$CODE_FILE" < "$INPUT_FILE" > "$OUTPUT_FILE" 2> "$ERROR_FILE"
        EXIT_CODE=$?
        ;;
    
    javascript)
        # Run Node.js
        timeout "$TIMEOUT" node "$CODE_FILE" < "$INPUT_FILE" > "$OUTPUT_FILE" 2> "$ERROR_FILE"
        EXIT_CODE=$?
        ;;
    
    *)
        echo "Unsupported language: $LANGUAGE"
        exit 1
        ;;
esac

# Handle exit codes
if [ $EXIT_CODE -eq 124 ]; then
    echo "TIME_LIMIT_EXCEEDED"
    exit 124
elif [ $EXIT_CODE -ne 0 ]; then
    cat "$ERROR_FILE"
    exit $EXIT_CODE
fi

# Output the result
cat "$OUTPUT_FILE"
exit 0
