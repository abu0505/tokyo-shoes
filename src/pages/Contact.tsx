import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface FAQItem {
    question: string;
    answer: string;
}

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSubmitting(false);
    };

    const toggleFAQ = (index: number) => {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    };

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email',
            value: 'contact@tokyokicks.com',
            color: 'bg-red-500/20 text-red-500'
        },
        {
            icon: Phone,
            title: 'Phone',
            value: '+91 98765 43210',
            color: 'bg-emerald-500/20 text-emerald-500'
        },
        {
            icon: MapPin,
            title: 'Location',
            value: 'Tokyo Fashion Juhapura',
            color: 'bg-blue-500/20 text-blue-500'
        },
        {
            icon: Clock,
            title: 'Hours',
            value: 'Mon - Sat: 10AM - 8PM',
            color: 'bg-amber-500/20 text-amber-500'
        }
    ];

    const faqItems: FAQItem[] = [
        {
            question: "How do I know my shoe size?",
            answer: "Check our size guide on any product page. If you're between sizes, we recommend going half a size up for a comfortable fit."
        },
        {
            question: "Are all shoes authentic?",
            answer: "Yes! We guarantee 100% authenticity on all our products. Every pair is carefully verified before being listed."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit cards, UPI, net banking, and popular digital wallets for a seamless checkout experience."
        },
        {
            question: "Can I track my order?",
            answer: "Absolutely! Once your order ships, you'll receive a tracking number via email to monitor your delivery."
        },
        {
            question: "What is your return policy?",
            answer: "We offer a 7-day return policy for unworn items in original packaging. Contact us for return authorization."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-12">
                {/* Page Header */}
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl font-black italic mb-4">Get In Touch</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Have questions about our sneakers? Want to know more about a specific product?
                        We're here to help. Drop us a message and we'll get back to you as soon as possible.
                    </p>
                </motion.div>

                {/* Contact Info Cards */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {contactInfo.map((info, index) => (
                        <div
                            key={info.title}
                            className="bg-secondary/50 border border-foreground/10 rounded-xl p-5 flex items-center gap-4 hover:border-accent/50 transition-colors"
                        >
                            <div className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center`}>
                                <info.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{info.title}</p>
                                <p className="font-bold text-sm">{info.value}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>



                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="bg-secondary/30 border border-foreground/10 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-accent" />
                                </div>
                                <h2 className="text-2xl font-bold">Send a Message</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                                            Your Name
                                        </label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            required
                                            className="bg-background/50 border-foreground/20"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                                            Email Address
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                            required
                                            className="bg-background/50 border-foreground/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                                        Subject
                                    </label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="How can we help?"
                                        required
                                        className="bg-background/50 border-foreground/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                                        Message
                                    </label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us more about your inquiry..."
                                        required
                                        rows={5}
                                        className="bg-background/50 border-foreground/20 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            Sending...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            SEND MESSAGE
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Interactive Map Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="bg-secondary/30 border border-foreground/10 rounded-xl overflow-hidden h-full flex flex-col">
                            <div className="p-4 border-b border-foreground/10 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Find Us</h3>
                                    <p className="text-sm text-muted-foreground">Tokyo Fashion Juhapura</p>
                                </div>
                            </div>
                            <div className="w-full flex-grow min-h-[400px]">
                                <iframe
                                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=Tokyo+Fashion,Juhapura,Ahmedabad,Gujarat,India&zoom=15`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Store Location Map"
                                    className="grayscale hover:grayscale-0 transition-all duration-500"
                                ></iframe>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* FAQ Section - Moved to bottom */}
                <motion.div
                    className="mb-12 pt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="bg-secondary/30 border border-foreground/10 rounded-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

                        <div className="space-y-3">
                            {faqItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="border border-foreground/10 rounded-lg overflow-hidden bg-background/30"
                                >
                                    <button
                                        onClick={() => toggleFAQ(index)}
                                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                                    >
                                        <span className="font-bold text-sm pr-4">{item.question}</span>
                                        <motion.div
                                            animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-shrink-0"
                                        >
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedFAQ === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-4 pt-0">
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {item.answer}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </main>

            <Footer />
            <BackToTopButton />
        </div>
    );
};

export default Contact;
