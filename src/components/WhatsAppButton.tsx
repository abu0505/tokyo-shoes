import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Shoe } from '@/types/shoe';
import { formatPrice } from '@/lib/format';

interface WhatsAppButtonProps {
  shoe: Shoe;
  selectedSize: number | null;
}

// Store owner's WhatsApp number - can be configured later
const STORE_WHATSAPP_NUMBER = '919876543210'; // Example Indian number

const WhatsAppButton = ({ shoe, selectedSize }: WhatsAppButtonProps) => {
  const handleWhatsAppClick = () => {
    const sizeText = selectedSize ? ` (Size: ${selectedSize})` : '';
    const message = encodeURIComponent(
      `Hi! I'm interested in ${shoe.name}${sizeText} - ${formatPrice(shoe.price)}. Is it available at your store?`
    );
    
    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-6 py-6 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline">Ask on WhatsApp</span>
    </Button>
  );
};

export default WhatsAppButton;
