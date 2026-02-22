import { pageMeta } from "@/app/layout";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, AlertCircle, Mail, FileText, Shield, Zap } from "lucide-react";

export const metadata = pageMeta["/terms"];

export default function TermsPage() {
	const sections = [
		{
			id: 1,
			title: "Eligibility",
			icon: <Shield className="w-5 h-5" />,
			content: "You must be at least 13 years old to use CodeWizard. If you are under 18, you must have permission from a parent or legal guardian."
		},
		{
			id: 2,
			title: "Account Registration",
			icon: <FileText className="w-5 h-5" />,
			items: [
				"Provide accurate and complete information",
				"Keep your login credentials secure",
				"Be responsible for all activity under your account"
			]
		},
		{
			id: 3,
			title: "Acceptable Use Policy",
			icon: <AlertCircle className="w-5 h-5" />,
			items: [
				"No hacking, exploiting, or damaging the platform",
				"No malware, viruses, or harmful code",
				"No abuse of the submission system",
				"No bypassing judge/security rules",
				"No scraping or copying data without permission",
				"No harassment, threats, or abuse",
				"No inappropriate, hateful, or offensive content"
			]
		},
		{
			id: 4,
			title: "Code Submissions and Execution",
			icon: <Zap className="w-5 h-5" />,
			items: [
				"Your code runs in isolated environments",
				"Execution time, memory, and resources may be limited",
				"Suspicious or abusive submissions may be blocked",
				"You are responsible for your code"
			]
		},
		{
			id: 5,
			title: "Intellectual Property",
			icon: <FileText className="w-5 h-5" />,
			items: [
				"All platform content is owned by CodeWizard or its licensors",
				"No copying, reproducing, or distributing content without permission"
			]
		},
		{
			id: 6,
			title: "User Content Ownership",
			icon: <CheckCircle className="w-5 h-5" />,
			content: "You retain ownership of your code and content, but grant CodeWizard a license to store, display, and process your submissions for platform functionality."
		},
		{
			id: 7,
			title: "Fair Use and Cheating Policy",
			icon: <Shield className="w-5 h-5" />,
			items: [
				"No cheating in exams or interviews",
				"No stealing solutions or publishing hidden test cases",
				"No exploiting bugs for unfair advantage"
			]
		},
		{
			id: 8,
			title: "Payments",
			icon: <Zap className="w-5 h-5" />,
			content: "Some features may become paid. Prices, refunds, and cancellation rules will be provided if/when paid plans are introduced."
		},
		{
			id: 9,
			title: "Privacy",
			icon: <Shield className="w-5 h-5" />,
			content: "Your use of CodeWizard is governed by our Privacy Policy. We collect and store certain user data to operate the platform."
		},
		{
			id: 10,
			title: "Service Availability",
			icon: <Zap className="w-5 h-5" />,
			content: "CodeWizard may update, modify, or temporarily suspend the Service for maintenance or technical reasons. We do not guarantee uninterrupted availability."
		},
		{
			id: 11,
			title: "Termination",
			icon: <AlertCircle className="w-5 h-5" />,
			items: [
				"Accounts may be suspended or terminated for rule violations or abuse",
				"You may stop using CodeWizard at any time"
			]
		},
		{
			id: 12,
			title: "Disclaimer of Warranties",
			icon: <Shield className="w-5 h-5" />,
			items: [
				"Platform is provided 'as is' and 'as available'",
				"No guarantee of accuracy, error-free test cases, or uninterrupted service"
			]
		},
		{
			id: 13,
			title: "Limitation of Liability",
			icon: <AlertCircle className="w-5 h-5" />,
			items: [
				"CodeWizard is not liable for loss of data, rankings, submissions, or indirect damages"
			]
		},
		{
			id: 14,
			title: "Changes to These Terms",
			icon: <FileText className="w-5 h-5" />,
			content: "We may update these Terms at any time. Continued use of CodeWizard means you accept the updated Terms."
		},
		{
			id: 15,
			title: "Governing Law",
			icon: <Shield className="w-5 h-5" />,
			content: "These Terms are governed by the laws of your country/region."
		}
	];

	return (
		<div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
			<Navbar />

			{/* Background Gradient */}
			<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
				<div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
			</div>

			<main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<div className="inline-block p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
							<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
							Terms of Service
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
							Please read these terms carefully. By using CodeWizard, you agree to be bound by these terms and conditions.
						</p>
					</div>

					{/* Table of Contents */}
					<div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-8 mb-12">
						<h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Table of Contents</h2>
						<div className="grid md:grid-cols-2 gap-4">
							{sections.map((section) => (
								<a
									key={section.id}
									href={`#section-${section.id}`}
									className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group"
								>
									<span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 group-hover:translate-x-1 transition-transform">
										{section.id}.
									</span>
									<span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
										{section.title}
									</span>
								</a>
							))}
						</div>
					</div>

					{/* Terms Content */}
					<div className="space-y-8">
						{sections.map((section) => (
							<div
								key={section.id}
								id={`section-${section.id}`}
								className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 p-8 hover:shadow-lg transition-all duration-300"
								style={{ scrollMarginTop: "100px" }}
							>
								{/* Section Header */}
								<div className="flex items-start gap-4 mb-6">
									<div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
										{section.icon}
									</div>
									<div className="flex-1">
										<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
											{section.id}. {section.title}
										</h2>
									</div>
								</div>

								{/* Section Content */}
								{section.content && (
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
										{section.content}
									</p>
								)}

								{/* Section Items */}
								{section.items && (
									<ul className="space-y-3">
										{section.items.map((item, index) => (
											<li key={index} className="flex items-start gap-3">
												<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
												<span className="text-gray-700 dark:text-gray-300">{item}</span>
											</li>
										))}
									</ul>
								)}
							</div>
						))}
					</div>

					{/* Contact Section */}
					<div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
						<h3 className="text-2xl font-bold mb-3">Questions?</h3>
						<p className="mb-6 text-blue-100">
							If you have any questions about these Terms of Service, please contact us.
						</p>
						
						<a
							href="mailto:support@CodeWizard.com"
							className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:shadow-lg transition-all"
						>
							<Mail className="w-5 h-5" />
							Email Support
						</a>
					</div>

					{/* Footer Note */}
					<div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<p className="text-sm text-yellow-800 dark:text-yellow-300">
							<strong>Important Notice:</strong> These Terms of Service may be updated at any time without prior notice. We recommend reviewing these terms periodically to stay informed of any changes.
						</p>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}