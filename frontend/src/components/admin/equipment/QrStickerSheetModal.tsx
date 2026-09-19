/**
 * System: DPRMS
 * Purpose: Render qr sticker sheet modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CheckSquare2, Printer, QrCode, Square } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';

import type { EquipmentRecord, Program } from '../../../data/admin';
import { ModalShell } from '../ModalShell';

interface Props
{
    arrEquipment: EquipmentRecord[];
    onClose: () => void;
    strProgram: Program;
}

/** Render qr sticker sheet modal and its available actions. */
export function QrStickerSheetModal({ arrEquipment, onClose, strProgram }: Props)
{
    const arrPrintable = useMemo(
        () => arrEquipment.filter((objItem) => objItem.qrData),
        [arrEquipment],
    );
    const [objSelectedIds, setObjSelectedIds] = useState<Set<string>>(
        () => new Set(arrPrintable.map((objItem) => objItem.id)),
    );
    const arrSelected = arrPrintable.filter((objItem) => objSelectedIds.has(objItem.id));
    const blnAllSelected = arrPrintable.length > 0 && arrSelected.length === arrPrintable.length;

    /** Toggle. */
    function _toggle(strId: string)
    {
        setObjSelectedIds((objCurrent) =>
        {
            const objNext = new Set(objCurrent);
            if (objNext.has(strId))
            {
                objNext.delete(strId);
            } else
            {
                objNext.add(strId);
            }
            return objNext;
        });
    }

    /** Toggle all. */
    function _toggleAll()
    {
        setObjSelectedIds(
            blnAllSelected ? new Set() : new Set(arrPrintable.map((objItem) => objItem.id)),
        );
    }

    return (
        <ModalShell
            txtDescription={`Select ${strProgram} assets and print a clean A4 adhesive-label sheet.`}
            objFooter={
                <div className="print-hidden flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        {arrSelected.length} of {arrPrintable.length} QR labels selected
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                            onClick={onClose}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={arrSelected.length === 0}
                            onClick={() => window.print()}
                            type="button"
                        >
                            <Printer className="size-4" />
                            Print QR sheet
                        </button>
                    </div>
                </div>
            }
            onClose={onClose}
            title="Printable QR Sticker Sheet"
            strWidth="xl"
        >
            <div className="print-hidden mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-black text-slate-900">Choose labels</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Assets without an active QR code are excluded automatically.
                        </p>
                    </div>
                    <button
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        onClick={_toggleAll}
                        type="button"
                    >
                        {blnAllSelected ? (
                            <CheckSquare2 className="size-4 text-[#0f53b7]" />
                        ) : (
                            <Square className="size-4" />
                        )}
                        {blnAllSelected ? 'Clear all' : 'Select all'}
                    </button>
                </div>
                {arrPrintable.length ? (
                    <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                        {arrPrintable.map((objItem) => (
                            <button
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                                key={objItem.id}
                                onClick={() => _toggle(objItem.id)}
                                type="button"
                            >
                                {objSelectedIds.has(objItem.id) ? (
                                    <CheckSquare2 className="size-4 shrink-0 text-[#0f53b7]" />
                                ) : (
                                    <Square className="size-4 shrink-0 text-slate-300" />
                                )}
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-bold text-slate-800">
                                        {objItem.name}
                                    </span>
                                    <span className="block truncate font-mono text-[10px] text-slate-500">
                                        {objItem.id}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center">
                        <QrCode className="mx-auto size-6 text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            No printable QR codes in this program.
                        </p>
                    </div>
                )}
            </div>

            <section
                className="printable-qr-sheet bg-white"
                aria-label={`${strProgram} QR sticker sheet`}
            >
                <header className="qr-sheet-heading hidden border-b-2 border-slate-900 pb-3 text-center">
                    <p className="text-[10pt] font-bold uppercase tracking-wide">
                        Republic of the Philippines
                    </p>
                    <h1 className="text-[15pt] font-black">Department of Science and Technology</h1>
                    <p className="text-[10pt] font-semibold">
                        {strProgram} Equipment Asset QR Sticker Sheet
                    </p>
                </header>
                <div className="qr-sticker-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {arrSelected.map((objItem) => (
                        <article
                            className="qr-sticker break-inside-avoid rounded-xl border-2 border-slate-900 bg-white p-3"
                            key={objItem.id}
                        >
                            <div className="border-b border-slate-400 pb-2 text-center">
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#073b82]">
                                    Department of Science and Technology
                                </p>
                                <p className="mt-0.5 text-[8px] font-bold uppercase">
                                    {strProgram} Equipment Asset
                                </p>
                            </div>
                            <div className="mt-2 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
                                <div className="grid size-[88px] place-items-center bg-white">
                                    {objItem.qrData ? (
                                        <QRCodeSVG
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="H"
                                            marginSize={1}
                                            size={84}
                                            value={objItem.qrData}
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-[11px] font-black leading-tight text-slate-950">
                                        {objItem.name}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-[8px] font-bold text-slate-700">
                                        {objItem.propertyNumber || objItem.id}
                                    </p>
                                    <dl className="mt-1.5 space-y-0.5 text-[7.5px] leading-tight text-slate-700">
                                        <div>
                                            <dt className="inline font-bold">Serial: </dt>
                                            <dd className="inline break-all">
                                                {objItem.serialNumber || 'Not recorded'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="inline font-bold">Project: </dt>
                                            <dd className="inline">{objItem.projectId}</dd>
                                        </div>
                                        <div>
                                            <dt className="inline font-bold">Location: </dt>
                                            <dd className="inline line-clamp-2">
                                                {objItem.location}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                            <p className="mt-2 border-t border-slate-300 pt-1.5 text-center text-[7px] font-semibold text-slate-600">
                                Scan using the DPRMS Equipment Inspection module
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </ModalShell>
    ); // end return
} /* end QrStickerSheetModal */
