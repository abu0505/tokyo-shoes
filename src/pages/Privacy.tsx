import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-grow pt-[5rem] pb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto prose prose-slate"
                >
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to Tokyo Shoes ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from)
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Financial Data</strong> includes payment card details (processed securely by our payment providers).</li>
                            <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., processing your order).</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We use trusted third-party services to operate our business securely. We use <strong>Supabase</strong> for authentication and database management to ensure your data is stored securely.
                            We use <strong>Resend</strong> for transactional emails to keep you updated on your orders. We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
                        <p className="text-gray-700 leading-relaxed">
                            You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies.
                            If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                        <p className="text-gray-700 leading-relaxed">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
                            <a href="mailto:support@tokyoshoes.com" className="text-primary hover:underline ml-1">support@tokyoshoes.com</a>.
                        </p>
                    </section>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
