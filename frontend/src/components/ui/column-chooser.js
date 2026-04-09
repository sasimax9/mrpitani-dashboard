import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Columns3 } from 'lucide-react';

export default function ColumnChooser({ columns, visibleColumns, onToggleColumn }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-sm border-border hover:bg-muted"
          data-testid="column-chooser-button"
        >
          <Columns3 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 bg-card border-border rounded-sm p-3" 
        align="end"
        style={{ backgroundColor: 'white', zIndex: 100 }}
      >
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground mb-3">Toggle Columns</div>
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted px-2 py-1.5 rounded-sm"
            >
              <Checkbox
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => onToggleColumn(column.key)}
                className="rounded-sm"
              />
              <span className="text-sm text-foreground">{column.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
