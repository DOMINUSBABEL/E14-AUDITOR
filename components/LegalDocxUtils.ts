import { AnalyzedAct } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';

export async function generateLegalDocxReport(acts: AnalyzedAct[], baseFileName: string) {
    const impugnableActs = acts.filter(act => act.is_fraud || act.document_integrity?.estado === 'IMPUGNABLE');

    if (impugnableActs.length === 0) {
        alert("No hay documentos impugnables en el lote seleccionado.");
        return;
    }

    const tableRows = [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Identificación del documento a impugnar", bold: true })] })],
                    shading: { fill: "D9D9D9" },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                }),
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Identificación de la causal formal de impugnación", bold: true })] })],
                    shading: { fill: "D9D9D9" },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                }),
            ],
        }),
    ];

    for (const act of impugnableActs) {
        const docIdentification = [
            `Mesa de votación: ${act.mesa}`,
            `Lugar de votación: ${act.zona}`,
            `Municipio: [Municipio]` // Placeholder as it's not strictly in AnalyzedAct
        ].join('\n');

        const forensicFindings = act.forensic_analysis.length > 0
            ? act.forensic_analysis.map(f => `- Se detectó ${f.type.toLowerCase()} en la casilla de ${f.affected_party}, con una confianza del ${Math.round((f.confidence || 0) * 100)}%.`).join('\n')
            : `- Discrepancia aritmética: Total Calculado (${act.total_calculated}) vs Total Declarado (${act.total_declared}).`;

        let legalReason = `Art. 275 Numeral 3 CPACA (Alteración de documentos o datos contrarios a la verdad).\n\nHallazgos técnicos:\n${forensicFindings}`;

        tableRows.push(
            new TableRow({
                children: [
                    new TableCell({
                        children: docIdentification.split('\n').map(line => new Paragraph({ text: line })),
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                        },
                    }),
                    new TableCell({
                        children: legalReason.split('\n').map(line => new Paragraph({ text: line })),
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                        },
                    }),
                ],
            })
        );
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "REPORTE GENERAL DE DOCUMENTOS IMPUGNABLES",
                                bold: true,
                                size: 28, // 14pt
                            }),
                        ],
                        alignment: "center",
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: tableRows,
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${baseFileName}.docx`);
}
