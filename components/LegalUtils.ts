import { AnalyzedAct } from '../types';

/**
 * Generates a formal judicial demand for electoral nullity and ballot box challenge
 * based on the Colombian Administrative and Electoral Law (CPACA & Electoral Code).
 */
export const generateLegalTemplate = (act: AnalyzedAct): string => {
  const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Extract specific findings for facts section
  const documentFindings = act.forensic_analysis.length > 0 
    ? act.forensic_analysis.map(f => `- Se detectó ${f.type.toLowerCase()} en la casilla de ${f.affected_party}, con una confianza del ${Math.round((f.confidence || 0) * 100)}%.`).join('\n')
    : `- Discrepancia aritmética: Total Calculado (${act.total_calculated}) vs Total Declarado (${act.total_declared}).`;

  const intentAnalysis = act.strategic_analysis?.intent === 'PERJUICIO' 
    ? "la exclusión injustificada de votos válidos" 
    : "la introducción de votos espurios o inexistentes";

  return `
SEÑORES:
HONORABLE TRIBUNAL ADMINISTRATIVO / CONSEJO DE ESTADO
REPARTO (DEPARTAMENTO DE SANTANDER / BOGOTÁ D.C. / SEGÚN COMPETENCIA)

REF: ACCIÓN DE NULIDAD ELECTORAL E IMPUGNACIÓN DE MESA DE VOTACIÓN
DEMANDANTE: [NOMBRE DEL CIUDADANO / APODERADO / PARTIDO POLÍTICO]
DEMANDADO: ACTO DE ELECCIÓN Y ESCRUTINIO - MESA ${act.mesa}
ID PROCESO FORENSE: ${act.id}

I. PRETENSIONES

1. Declarar la NULIDAD del registro de votación contenido en el formulario E-14 de la MESA ${act.mesa}, ZONA ${act.zona}, por configurarse las causales previstas en el Artículo 275 de la Ley 1437 de 2011 (CPACA).
2. Como consecuencia de lo anterior, ordenar la EXCLUSIÓN del cómputo general de los votos consignados en dicha mesa o, en su defecto, proceder al RECONTEO FÍSICO DE LA URNA para restablecer la verdad electoral.
3. Solicitar a la Registraduría Nacional del Estado Civil la remisión inmediata del sobre de claveros y delegados para cotejo técnico.

II. HECHOS Y FUNDAMENTOS DE LA IMPUGNACIÓN

1. DEL DOCUMENTO ELECTORAL (E-14):
Mediante el uso de herramientas de auditoría forense digital con inteligencia artificial, se ha identificado de manera inequívoca que el formulario E-14 de la referencia ha sido objeto de MANIPULACIÓN POSTERIOR al cierre de la mesa. Los hallazgos específicos son:
${documentFindings}

Esta alteración constituye una violación directa a la cadena de custodia y a la autenticidad del documento público electoral.

2. DE LA URNA Y EL ESCRUTINIO:
La inconsistencia detectada sugiere una maniobra tendiente a ${intentAnalysis}. Bajo los términos del Artículo 192 del Código Electoral (Decreto 2241 de 1986), se impugna la integridad de la URNA de la mesa ${act.mesa} por existir una diferencia numérica superior al margen de error humano, lo que hace presumir la introducción de votos fraudulentos o la supresión de los mismos.

III. FUNDAMENTOS DE DERECHO

La presente acción se sustenta en el siguiente marco normativo vigente:
- CONSTITUCIÓN POLÍTICA: Artículos 40 (Derecho a participar en la conformación del poder) y 258 (Voto como derecho y deber).
- LEY 1437 DE 2011 (CPACA): Artículo 275, Numerales 3 y 4. (Causales de nulidad por alteración de documentos y errores aritméticos).
- CÓDIGO ELECTORAL (D. 2241 DE 1986): Artículos 164, 192 y concordantes sobre el proceso de escrutinio e impugnaciones ante testigos y claveros.

IV. PRUEBAS

1. DOCUMENTAL: Impresión de la captura digital del formulario E-14 analizado.
2. PERICIAL TÉCNICA: Informe de análisis forense emitido por el sistema "E-14 Real-Time Auditor" donde se certifica el NIVEL DE CONFIANZA: ${act.document_integrity?.nivel_de_confianza || 'Bajo/Medio'} y la trazabilidad de la alteración detectada.
3. COTEJO: Solicitud de exhibición del formulario E-14 original (Claveros) reposante en el arca triclave.

V. NOTIFICACIONES

[DIRECCIÓN FÍSICA Y ELECTRÓNICA DEL DEMANDANTE]

Atentamente,

__________________________________________
[NOMBRE DEL ABOGADO / APODERADO]
T.P. No. ___________ del C.S. de la J.
PROYECTADO POR: E-14 REAL-TIME AUDITOR - MÓDULO JURÍDICO CPACA
FECHA DE GENERACIÓN: ${date}
  `;
};
