import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Lightbulb, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  trigger?: React.ReactNode;
}

const sizeData = [
  { us: 6, uk: 5.5, eu: 38.5, cm: 24 },
  { us: 7, uk: 6, eu: 40, cm: 25 },
  { us: 8, uk: 7, eu: 41, cm: 26 },
  { us: 9, uk: 8, eu: 42.5, cm: 27 },
  { us: 10, uk: 9, eu: 44, cm: 28 },
  { us: 11, uk: 10, eu: 45, cm: 29 },
  { us: 12, uk: 11, eu: 46, cm: 30 },
];

const SizeGuideModal = ({ trigger }: SizeGuideModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-sm text-accent hover:underline font-medium flex items-center gap-1">
            <Ruler className="w-4 h-4" />
            Size Guide
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col border-2 border-foreground p-0 bg-white text-foreground">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
            SIZE GUIDE
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4 scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-500 font-bold text-sm py-4">US</TableHead>
                <TableHead className="text-gray-500 font-bold text-sm py-4">UK</TableHead>
                <TableHead className="text-gray-500 font-bold text-sm py-4">EU</TableHead>
                <TableHead className="text-gray-500 font-bold text-sm py-4">CM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizeData.map((size, index) => (
                <TableRow
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <TableCell className="text-foreground font-semibold py-4">{size.us}</TableCell>
                  <TableCell className="text-gray-600 py-4">{size.uk}</TableCell>
                  <TableCell className="text-gray-600 py-4">{size.eu}</TableCell>
                  <TableCell className="text-gray-600 py-4">{size.cm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Tip Section */}
        <div className="p-6 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3 text-sm">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-500">
              <span className="text-amber-600 font-medium">Tip:</span> If you're between sizes, we recommend sizing up for a more comfortable fit.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGuideModal;
