import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
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
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
                    <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            By accessing and placing an order with Tokyo Shoes, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below.
                            These terms apply to the entire website and any email or other type of communication between you and Tokyo Shoes.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Products & Services</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site.
                            However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors,
                            and your electronic display may not accurately reflect the actual colors and details of the products.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            All products are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time for any reason.
                            Prices for all products are subject to change.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Shipping & Returns</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            <strong>Shipping:</strong> We process orders within 1-3 business days. Delivery times may vary depending on your location.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            <strong>Returns:</strong> Returns are accepted within 7 days of delivery for eligible items in their original condition.
                            Please verify your size & product details before confirming your order. To initiate a return, please contact our support team.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Tokyo Shoes shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to,
                            damages for loss of profits, goodwill, use, data or other intangible losses resulting from the use of or inability to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Governing Law</h2>
                        <p className="text-gray-700 leading-relaxed">
                            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Changes to Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective,
                            you agree to be bound by the revised terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
                        <p className="text-gray-700 leading-relaxed">
                            If you have any questions about these Terms, please contact us at:
                            <a href="mailto:support@tokyoshoes.com" className="text-primary hover:underline ml-1">support@tokyoshoes.com</a>.
                        </p>
                    </section>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
