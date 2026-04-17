import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface TypedConfirmDialogProps {
  confirmButtonLabel: string;
  confirmationValue: string;
  description: string;
  details?: ReactNode;
  onConfirm: () => void;
  title: string;
  trigger: ReactNode;
}

function normalizeConfirmationValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

export function TypedConfirmDialog({
  confirmButtonLabel,
  confirmationValue,
  description,
  details,
  onConfirm,
  title,
  trigger,
}: TypedConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedValue, setTypedValue] = useState('');
  const inputId = useId();
  const normalizedExpectedValue = normalizeConfirmationValue(confirmationValue);
  const canConfirm =
    normalizedExpectedValue.length > 0 &&
    normalizeConfirmationValue(typedValue) === normalizedExpectedValue;

  useEffect(() => {
    if (!isOpen) {
      setTypedValue('');
    }
  }, [isOpen]);

  function handleConfirm() {
    if (!canConfirm) {
      return;
    }

    onConfirm();
    setIsOpen(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-[28px] border-gray-200 bg-white p-6 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-gray-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6 text-gray-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {details ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {details}
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Digite a frase abaixo para confirmar:</p>
            <p className="mt-3 rounded-xl bg-gray-900 px-3 py-2 font-mono text-sm text-white">
              {confirmationValue}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId}>Confirmacao digitada</Label>
            <Input
              id={inputId}
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              placeholder={confirmationValue}
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-xl"
          >
            {confirmButtonLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
