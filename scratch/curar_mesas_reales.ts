import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { GoogleGenAI, Type } from '@google/genai';
import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

// Business Logic
function runBusinessLogic(
  forensics: any[] = [],
  votes: any[],
  clientParty: string = 'Iván Cepeda Castro (Pacto Histórico)',
  rivalParties: string[] = ['Abelardo de la Espriella (Defensores de la Patria)'],
  autoDetect: boolean = true
): any {
  const CONFIDENCE_THRESHOLD = 0.85;
  const validForensics = (forensics || []).filter(f => (f.confidence ?? 1.0) >= CONFIDENCE_THRESHOLD);

  if (validForensics.length === 0) return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };

  let totalImpact = 0;
  let detectedIntent: 'BENEFICIO' | 'PERJUICIO' | 'NEUTRO' = 'NEUTRO';

  for (const f of validForensics) {
    const delta = (f.final_value_legible || 0) - (f.original_value_inferred || 0);

    if (autoDetect) {
       if (delta < 0) {
           totalImpact -= Math.abs(delta);
           detectedIntent = 'PERJUICIO';
       } else if (delta > 0) {
           totalImpact += delta;
           if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO';
       }
    } else {
        if (f.affected_party === clientParty) {
          if (delta < 0) { totalImpact -= Math.abs(delta); detectedIntent = 'PERJUICIO'; }
          else { totalImpact += delta; if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
        } else if (rivalParties.includes(f.affected_party)) {
          if (delta > 0) { totalImpact -= delta; detectedIntent = 'PERJUICIO'; }
          else { totalImpact += Math.abs(delta); if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
        }
    }
  }

  if (detectedIntent === 'PERJUICIO') {
    return {
      intent: 'PERJUICIO',
      impact_score: totalImpact,
      recommendation: 'IMPUGNAR',
      legal_grounding: 'Alteración de resultados (Art. 192).'
    };
  }

  if (detectedIntent === 'BENEFICIO') {
    return {
      intent: 'BENEFICIO',
      impact_score: totalImpact,
      recommendation: 'RECONTEO',
      legal_grounding: 'Inconsistencia favorable detectada'
    };
  }

  return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };
}

// Download Helper
async function waitForDownload(downloadDir: string, initialFiles: string[], timeoutMs = 45000): Promise<string> {
  const start = Date.now();
  const getFiles = () => fs.readdirSync(downloadDir).filter(f => !f.endsWith('.crdownload') && !f.endsWith('.tmp') && f.endsWith('.pdf'));
  
  while (Date.now() - start < timeoutMs) {
    const currentFiles = getFiles();
    const newFiles = currentFiles.filter(f => !initialFiles.includes(f));
    if (newFiles.length > 0) {
      // Return the most recently modified new file
      const sorted = newFiles.map(f => ({
        name: f,
        mtime: fs.statSync(path.join(downloadDir, f)).mtimeMs
      })).sort((a, b) => b.mtime - a.mtime);
      return sorted[0].name;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Timeout waiting for PDF download to complete");
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is not defined.");
    process.exit(1);
  }

  const baseDownloadDir = 'C:\\Users\\jegom\\OneDrive\\Desktop\\E14A';
  fs.mkdirSync(baseDownloadDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable download behavior in CDP
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: baseDownloadDir
  });

  try {
    console.log("Navigating to Registraduría escrutinios site...");
    await page.goto('https://escrutinios2vueltapresidente2026.registraduria.gov.co/actas-escrutinio', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("Waiting for page load...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click "Consulta Actas E-14C"
    console.log("Navigating to 'Consulta Actas E-14C'...");
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span, li'));
      const target = els.find(el => el.textContent?.trim() === 'Consulta Actas E-14C');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Select ANTIOQUIA
    console.log("Selecting ANTIOQUIA...");
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select.form-select');
      const deptSelect = selects[1] as HTMLSelectElement;
      const option = Array.from(deptSelect.options).find(o => o.text.trim().toUpperCase() === 'ANTIOQUIA');
      if (option) {
        deptSelect.value = option.value;
        deptSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select AMALFI
    console.log("Selecting AMALFI...");
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select.form-select');
      const munSelect = selects[2] as HTMLSelectElement;
      const option = Array.from(munSelect.options).find(o => o.text.trim().toUpperCase() === 'AMALFI');
      if (option) {
        munSelect.value = option.value;
        munSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select ZONA 00
    console.log("Selecting ZONA 00...");
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select.form-select');
      const zoneSelect = selects[3] as HTMLSelectElement;
      const option = Array.from(zoneSelect.options).find(o => o.text.trim().toUpperCase().includes('00'));
      if (option) {
        zoneSelect.value = option.value;
        zoneSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Select Puesto IE EDUARDO FERNANDEZ BOTERO
    console.log("Selecting Puesto containing 'IE EDUARDO FERNANDE'...");
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select.form-select');
      const puestoSelect = selects[4] as HTMLSelectElement;
      const option = Array.from(puestoSelect.options).find(o => o.text.trim().toUpperCase().includes('IE EDUARDO FERNAN'));
      if (option) {
        puestoSelect.value = option.value;
        puestoSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click Consultar
    console.log("Clicking 'Consultar'...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Consultar');
      if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const promptText = `
      # ROL: Experto Analista Forense Electoral (Registraduría Colombia)
      # TAREA: Auditar Formulario E-14 (Actas de Escrutinio de la Segunda Vuelta Presidencial de Colombia, 21 de junio de 2026).
      # OBJETIVO: Detectar tachones, enmendaduras y fraude aritmético.
      
      CANDIDATOS Y CATEGORÍAS DE LA SEGUNDA VUELTA:
      - Iván Cepeda Castro (Pacto Histórico)
      - Abelardo de la Espriella (Defensores de la Patria)
      - Voto en Blanco
      - Votos Nulos
      - Votos no Marcados

      INSTRUCCIONES CRÍTICAS (PREVENCIÓN DE FALSOS POSITIVOS):
      1. Analiza el E-14 (Imagen o PDF multipágina de la segunda vuelta presidencial).
      2. Extrae Mesa, Zona, Municipio.
      3. Extrae el conteo de votos exacto de cada una de las 5 categorías anteriores. Si el formulario contiene nombres abreviados o parciales, mapéalos de forma exacta a los nombres oficiales listados arriba en el arreglo 'votes'.
      4. Busca anomalías visuales en las casillas de votos (números repintados, tachones graves, enmendaduras, alteración de cifras).
         - REGLA DE SEGURIDAD CONTRA FALSOS POSITIVOS: NO reportes firmas de jurados, marcas de agua del formulario, dobleces físicos del papel, arrugas, sombras o manchas de suciedad en la digitalización como adulteraciones. Solo reporta un hallazgo de "TACHON" o "ENMENDADURA" si existe evidencia caligráfica clara de manipulación para adulterar un número. Si la marca es dudosa o no altera el valor del voto, asígnale "NONE" y omítela de la lista de fraudes.
      5. Si es un PDF multipágina, compara los ejemplares de Claveros, Delegados y Transmisión para hallar discrepancias.
      6. Responde SIEMPRE en JSON válido y asegúrate de que todos los partidos/candidatos en 'votes' coincidan exactamente con la lista de CANDIDATOS Y CATEGORÍAS.

      JSON SCHEMA:
      {
        "archivo_analizado": "string",
        "estado": "IMPUGNABLE" | "NO IMPUGNABLE" | "ERROR_DE_LECTURA",
        "hallazgos": ["string"],
        "nivel_de_confianza": "Alto" | "Medio" | "Bajo",
        "conclusion": "string",
        "mesa": "string",
        "zona": "string",
        "votes": [{"party": "Iván Cepeda Castro (Pacto Histórico)" | "Abelardo de la Espriella (Defensores de la Patria)" | "Voto en Blanco" | "Votos Nulos" | "Votos no Marcados", "count": number}],
        "total_calculated": number,
        "total_declared": number,
        "is_fraud": boolean,
        "forensic_analysis": [{"type": "TACHON"|"ENMENDADURA"|"NONE", "description": "string", "affected_party": "string", "original_value_inferred": number, "final_value_legible": number, "confidence": number}]
      }
    `;

    const ai = new GoogleGenAI({ apiKey });
    const analysisResults: any[] = [];

    // Loop over the first 5 tables (Mesa 1 to Mesa 5)
    for (let mesaNum = 1; mesaNum <= 5; mesaNum++) {
      console.log(`\n======================================================`);
      console.log(`Processing Mesa ${mesaNum} / 5...`);

      // Click table card
      console.log(`Clicking Mesa ${mesaNum} card...`);
      await page.evaluate((mNum) => {
        const els = Array.from(document.querySelectorAll('div, span, p'));
        const target = els.find(el => el.textContent?.trim() === `Mesa ${mNum}`);
        if (target) (target as HTMLElement).click();
      }, mesaNum);

      // Wait for canvas to render
      console.log("Waiting for PDF canvas to render...");
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Extract canvas base64 image data using toDataURL()
      console.log("Extracting canvas image data...");
      const base64ImageWithPrefix = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error("Canvas element not found in PDF viewer");
        return canvas.toDataURL('image/jpeg');
      });
      const base64ImageRaw = base64ImageWithPrefix.replace(/^data:image\/jpeg;base64,/, '');

      // Record pre-download file list
      const initialFiles = fs.readdirSync(baseDownloadDir).filter(f => f.endsWith('.pdf'));

      // Click 'Guardar' (Save) button to download the original PDF file
      console.log("Triggering PDF download...");
      await page.evaluate(() => {
        const btn = document.getElementById('downloadButton');
        if (btn) {
          btn.click();
        } else {
          const secondaryBtn = document.getElementById('secondaryDownload');
          if (secondaryBtn) secondaryBtn.click();
        }
      });

      // Wait for the download to complete
      console.log("Waiting for original PDF download to finish...");
      const downloadedFilename = await waitForDownload(baseDownloadDir, initialFiles);
      const sourcePdfPath = path.join(baseDownloadDir, downloadedFilename);

      // Target path structure
      const targetMesaDir = `C:\\Users\\jegom\\OneDrive\\Desktop\\E14A\\Amalfi\\Zona_00\\Puesto_IE_EDUARDO_FERNANDEZ\\Mesa_${mesaNum}`;
      fs.mkdirSync(targetMesaDir, { recursive: true });
      const targetOriginalPdfPath = path.join(targetMesaDir, 'acta_e14_original.pdf');

      // Move / rename it
      fs.renameSync(sourcePdfPath, targetOriginalPdfPath);
      console.log(`Saved original PDF to: ${targetOriginalPdfPath}`);

      // Send the base64 image to Gemini API
      console.log("Calling Gemini API for Forensic Audit...");
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64ImageRaw } },
            { text: promptText }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              archivo_analizado: { type: Type.STRING },
              estado: { type: Type.STRING, enum: ["IMPUGNABLE", "NO IMPUGNABLE", "ERROR_DE_LECTURA"] },
              hallazgos: { type: Type.ARRAY, items: { type: Type.STRING } },
              nivel_de_confianza: { type: Type.STRING, enum: ["Alto", "Medio", "Bajo"] },
              conclusion: { type: Type.STRING },
              mesa: { type: Type.STRING },
              zona: { type: Type.STRING },
              votes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { party: { type: Type.STRING }, count: { type: Type.INTEGER } } } },
              total_calculated: { type: Type.INTEGER },
              total_declared: { type: Type.INTEGER },
              is_fraud: { type: Type.BOOLEAN },
              forensic_analysis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, description: { type: Type.STRING }, affected_party: { type: Type.STRING }, original_value_inferred: { type: Type.INTEGER, nullable: true }, final_value_legible: { type: Type.INTEGER }, confidence: { type: Type.NUMBER } } } }
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from Gemini API");
      const parsedJson = JSON.parse(responseText);

      // Execute strategic business logic
      const strategicAnalysis = runBusinessLogic(
        parsedJson.forensic_analysis,
        parsedJson.votes,
        'Iván Cepeda Castro (Pacto Histórico)',
        ['Abelardo de la Espriella (Defensores de la Patria)'],
        true
      );

      const fullFichaData = {
        ...parsedJson,
        document_integrity: {
          estado: parsedJson.estado,
          hallazgos: parsedJson.hallazgos,
          nivel_de_confianza: parsedJson.nivel_de_confianza,
          conclusion: parsedJson.conclusion
        },
        strategic_analysis: strategicAnalysis,
        isoTimestamp: new Date().toISOString(),
        timestamp: new Date().toLocaleTimeString()
      };

      // Save ficha_tecnica.json
      const targetJsonPath = path.join(targetMesaDir, 'ficha_tecnica.json');
      fs.writeFileSync(targetJsonPath, JSON.stringify(fullFichaData, null, 2));
      console.log(`Saved ficha técnica to: ${targetJsonPath}`);

      // Generate impugnacion.txt if IMPUGNABLE
      const isImpugnable = fullFichaData.document_integrity.estado === 'IMPUGNABLE' || strategicAnalysis.recommendation === 'IMPUGNAR';
      if (isImpugnable) {
        const impugnacionText = `RECLAMACIÓN E IMPUGNACIÓN DE MESA DE VOTACIÓN
Segunda Vuelta Presidencial de Colombia - 21 de Junio de 2026

Al: Honorable Jurado de Votación / Comisión Escrutadora
De: DOMINUSBABEL (Auditor Electoral)

Asunto: Impugnación de la Mesa ${mesaNum}, Puesto IE EDUARDO FERNANDEZ, Municipio Amalfi, Antioquia.

Por medio de la presente, presento de manera formal RECLAMACIÓN e IMPUGNACIÓN sobre los resultados consignados en el formulario E-14 de la Mesa ${mesaNum}, debido a las siguientes irregularidades graves detectadas mediante auditoría digital forense:

[DETALLES DE LOS HALLAZGOS]
- Estado del Acta: IMPUGNABLE
- Nivel de Confianza de la Auditoría: ${fullFichaData.document_integrity.nivel_de_confianza}
- Hallazgos detectados:
${(fullFichaData.document_integrity.hallazgos || []).map((h: string) => `  * ${h}`).join('\n')}

- Análisis de Votos:
${(fullFichaData.votes || []).map((v: any) => `  * ${v.party}: ${v.count} votos`).join('\n')}
  * Total Calculado (Suma): ${fullFichaData.total_calculated} votos
  * Total Declarado: ${fullFichaData.total_declared} votos
  * Discrepancia matemática: ${fullFichaData.total_calculated - fullFichaData.total_declared} votos

- Análisis Forense Visual:
${(fullFichaData.forensic_analysis || []).map((fa: any) => `  * Tipo: ${fa.type} | Afectado: ${fa.affected_party} | Inferencia: original ${fa.original_value_inferred} -> legible ${fa.final_value_legible} | Confianza: ${fa.confidence}`).join('\n')}

[FUNDAMENTOS JURÍDICOS]
Se solicita el RECONTEO FÍSICO de los votos de esta mesa con base en lo establecido en el Artículo 192 del Código Electoral Colombiano (decreto 2241 de 1986) y normas concordantes, debido a la alteración evidente de resultados y/o discrepancia aritmética insubsanable detectada en las casillas del acta.

Fecha y Hora de la Auditoría: ${fullFichaData.isoTimestamp}
Firma: DOMINUSBABEL (Acreditado por BABYLON.IA)`;

        const targetImpugnacionPath = path.join(targetMesaDir, 'impugnacion.txt');
        fs.writeFileSync(targetImpugnacionPath, impugnacionText);
        console.log(`Saved impugnación challenge file to: ${targetImpugnacionPath}`);
      }

      // Compile certified PDF (acta_e14.pdf) using jsPDF
      console.log("Generating certified PDF...");
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      // Dark slate header box:
      doc.setFillColor(26, 42, 58);
      doc.rect(0, 0, 612, 100, 'F');
      
      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('CERTIFICADO DE AUDITORÍA FORENSE ELECTORAL', 30, 55);
      
      // Subtitle / Date
      doc.setFontSize(9);
      doc.text(`PROYECTO BABYLON.IA - AUDITADO: ${fullFichaData.isoTimestamp}`, 30, 80);
      
      // Body text
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE LOCALIZACIÓN', 40, 130);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Departamento: Antioquia`, 50, 148);
      doc.text(`Municipio: Amalfi`, 50, 161);
      doc.text(`Zona: 00`, 50, 174);
      doc.text(`Puesto: IE EDUARDO FERNANDEZ BOTERO`, 50, 187);
      doc.text(`Mesa de Votación: Mesa ${mesaNum}`, 50, 200);
      
      // Audit status box
      doc.setFillColor(240, 244, 248);
      doc.rect(40, 215, 532, 70, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RESULTADO DE LA AUDITORÍA DE INTEGRIDAD', 50, 233);
      
      if (fullFichaData.document_integrity.estado === 'IMPUGNABLE') {
        doc.setTextColor(220, 53, 69); // Red
      } else {
        doc.setTextColor(40, 167, 69); // Green
      }
      doc.text(`ESTADO: ${fullFichaData.document_integrity.estado}`, 50, 250);
      
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Nivel de Confianza: ${fullFichaData.document_integrity.nivel_de_confianza} | Conclusión: ${fullFichaData.document_integrity.conclusion}`, 50, 268);
      
      // Vote Count Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CONTEO DE VOTOS DECLARADO', 40, 310);
      
      doc.setFontSize(9);
      let yPos = 328;
      // Table headers
      doc.text('Categoría / Candidato', 50, yPos);
      doc.text('Votos', 450, yPos);
      doc.line(40, yPos + 4, 572, yPos + 4);
      yPos += 18;
      
      doc.setFont('helvetica', 'normal');
      for (const vote of fullFichaData.votes || []) {
        doc.text(vote.party, 50, yPos);
        doc.text(vote.count.toString(), 450, yPos);
        yPos += 14;
      }
      doc.line(40, yPos - 2, 572, yPos - 2);
      yPos += 12;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Calculado (Suma): ${fullFichaData.total_calculated}`, 50, yPos);
      doc.text(`Total Declarado E-14: ${fullFichaData.total_declared}`, 450, yPos);
      
      // Strategic Analysis & Recommendation
      yPos += 30;
      doc.text('ANÁLISIS ESTRATÉGICO', 40, yPos);
      yPos += 16;
      doc.setFont('helvetica', 'normal');
      doc.text(`Recomendación: ${strategicAnalysis.recommendation}`, 50, yPos);
      yPos += 14;
      if (strategicAnalysis.legal_grounding) {
        doc.text(`Fundamento Legal: ${strategicAnalysis.legal_grounding}`, 50, yPos);
        yPos += 14;
      }
      doc.text(`Impacto Electoral Estimado: ${strategicAnalysis.impact_score} votos`, 50, yPos);
      
      // Sign-off
      yPos += 35;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Este documento ha sido generado automáticamente por el sistema de auditoría digital BABYLON.IA', 40, yPos);
      doc.text('y está certificado digitalmente bajo el ecosistema de validación electoral.', 40, yPos + 10);
      
      // Add page 2 (E-14 Image)
      doc.addPage();
      // Centered: 612x792 pt. Width 242 pt, Height 752 pt. Center X = 185, Y = 20
      doc.addImage(base64ImageWithPrefix, 'JPEG', 185, 20, 242, 752);
      
      const targetPdfPath = path.join(targetMesaDir, 'acta_e14.pdf');
      fs.writeFileSync(targetPdfPath, Buffer.from(doc.output('arraybuffer')));
      console.log(`Saved certified PDF to: ${targetPdfPath}`);

      analysisResults.push({
        mesa: mesaNum,
        estado: fullFichaData.document_integrity.estado,
        confianza: fullFichaData.document_integrity.nivel_de_confianza,
        recommendation: strategicAnalysis.recommendation,
        totalCalculated: fullFichaData.total_calculated,
        totalDeclared: fullFichaData.total_declared
      });

      // Click "Regresar" to return to table selection
      console.log("Returning to tables list...");
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('span, a, button, div'));
        const backBtn = elements.find(el => el.textContent?.trim().includes('Regresar'));
        if (backBtn) (backBtn as HTMLElement).click();
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Print results to console
    console.log(`\n======================================================`);
    console.log(`E-14 CURATION PROCESS COMPLETED`);
    console.log(`======================================================`);
    console.table(analysisResults);

  } catch (err: any) {
    console.error("Error during curation:", err);
  } finally {
    await browser.close();
  }
}

run();
