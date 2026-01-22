import { Ruler } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const sizeData = [
  { eu: 37, usM: 5, uk: 4.5 },
  { eu: 38, usM: 5.5, uk: 5 },
  { eu: 39, usM: 6.5, uk: 6 },
  { eu: 40, usM: 7, uk: 6.5 },
  { eu: 41, usM: 8, uk: 7.5 },
  { eu: 42, usM: 8.5, uk: 8 },
  { eu: 43, usM: 9.5, uk: 9 },
  { eu: 44, usM: 10, uk: 9.5 },
  { eu: 45, usM: 11, uk: 10.5 },
  { eu: 46, usM: 12, uk: 11 },
];

interface SizeGuideModalProps {
  trigger?: React.ReactNode;
}

const SizeGuideModal = ({ trigger }: SizeGuideModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-sm text-accent hover:underline font-medium inline-flex items-center gap-1">
            <Ruler className="h-4 w-4" />
            Size Guide
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Size Guide</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Find your perfect fit with our size conversion chart.
          </p>
        </DialogHeader>

        {/* Size Table */}
        <div className="border-2 border-foreground overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-foreground hover:bg-foreground">
                <TableHead className="text-background font-bold text-center">EU</TableHead>
                <TableHead className="text-background font-bold text-center">US (Men)</TableHead>
                <TableHead className="text-background font-bold text-center">UK</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizeData.map((row) => (
                <TableRow key={row.eu} className="hover:bg-muted/50">
                  <TableCell className="text-center font-bold">{row.eu}</TableCell>
                  <TableCell className="text-center">{row.usM}</TableCell>
                  <TableCell className="text-center">{row.uk}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* How to Measure */}
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <h3 className="font-bold text-sm tracking-wide mb-3">HOW TO MEASURE</h3>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-foreground">1.</span>
              Place a piece of paper against a wall and stand on it with your heel against the wall.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">2.</span>
              Mark the longest part of your foot on the paper.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">3.</span>
              Measure the distance from the wall to the mark in centimeters.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-foreground">4.</span>
              Compare with the size chart above to find your perfect size.
            </li>
          </ol>
        </div>

        {/* Tip */}
        <div className="text-xs text-muted-foreground text-center mt-2">
          💡 <strong>Tip:</strong> If you're between sizes, we recommend going up a half size for a more comfortable fit.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGuideModal;
