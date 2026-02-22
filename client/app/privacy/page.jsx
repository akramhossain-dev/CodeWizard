import { pageMeta } from "@/app/layout";
import { CheckCircle, AlertCircle, Mail, FileText, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = pageMeta["/privacy"];

export default function PrivacyPage() {
	const sections = [
		{
			id: 1,
			title: "Introduction",
			icon: <FileText className="w-5 h-5" />,
			content:
				"We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how CodeWizard collects, uses, and safeguards your data.",
		},
		{
			id: 2,
			title: "Information We Collect",
			icon: <Shield className="w-5 h-5" />,
			items: [
				"Account information (name, email, username, etc.)",
				"Profile details and preferences",
				"Problem submissions and activity logs",
				"Usage data (browser, device, IP address, etc.)",
				"Cookies and similar tracking technologies",
			],
		},
		{
			id: 3,
			title: "How We Use Your Information",
			icon: <Zap className="w-5 h-5" />,
			items: [
				"To provide and improve the CodeWizard platform",
				"To personalize your experience",
				"To communicate with you about updates, features, or support",
				"To analyze usage and improve security",
				"To comply with legal obligations",
			],
		},
		{
			id: 4,
			title: "Data Sharing and Disclosure",
			icon: <AlertCircle className="w-5 h-5" />,
			items: [
				"We do not sell your personal information",
				"We may share data with trusted service providers for platform operation",
				"We may disclose information if required by law or to protect CodeWizard",
			],
		},
		{
			id: 5,
			title: "Cookies and Tracking",
			icon: <FileText className="w-5 h-5" />,
			content:
				"We use cookies and similar technologies to remember your preferences, analyze traffic, and enhance your experience. You can control cookies through your browser settings.",
		},
		{
			id: 6,
			title: "Data Security",
			icon: <Shield className="w-5 h-5" />,
			content:
				"We implement reasonable security measures to protect your data. However, no system is 100% secure, and we cannot guarantee absolute security.",
		},
		{
			id: 7,
			title: "Your Rights",
			icon: <CheckCircle className="w-5 h-5" />,
			items: [
				"You can access, update, or delete your account information at any time",
				"You may request deletion of your account by contacting support",
				"You can opt out of non-essential communications",
			],
		},
		{
			id: 8,
			title: "Children's Privacy",
			icon: <AlertCircle className="w-5 h-5" />,
			content:
				"CodeWizard is not intended for children under 13. We do not knowingly collect data from children under 13.",
		},
		{
			id: 9,
			title: "Changes to This Policy",
			icon: <FileText className="w-5 h-5" />,
			content:
				"We may update this Privacy Policy from time to time. We will notify users of significant changes via the platform or email.",
		},
		{
			id: 10,
			title: "Contact Us",
			icon: <Mail className="w-5 h-5" />,
			content: (
				<span>
					If you have questions about this Privacy Policy, contact us at{' '}
					<a href="mailto:support@CodeWizard.com" className="text-blue-600 dark:text-blue-400 underline">support@CodeWizard.com</a>.
				</span>
			),
		},
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
							<Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
							Privacy Policy
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
							Learn how we collect, use, and protect your information at CodeWizard.
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

					{/* Privacy Content */}
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
							If you have any questions about this Privacy Policy, please contact us.
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
							<strong>Notice:</strong> This Privacy Policy may be updated at any time without prior notice. We recommend reviewing this page periodically to stay informed of any changes.
						</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
