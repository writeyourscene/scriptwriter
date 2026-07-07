package com.scriptwriter.util;

import com.scriptwriter.enums.ScreenplayElementType;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageSz;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public final class ScreenplayDocxExporter {

    private ScreenplayDocxExporter() {}

    private static String getFontFamily(String fontFamily) {
        if ("Courier New".equalsIgnoreCase(fontFamily) || "Courier Prime".equalsIgnoreCase(fontFamily) || "Special Elite".equalsIgnoreCase(fontFamily)) {
            return "Courier New";
        } else if ("Cinzel".equalsIgnoreCase(fontFamily)) {
            return "Times New Roman";
        } else if ("Space Mono".equalsIgnoreCase(fontFamily)) {
            return "Consolas";
        } else if ("IM Fell English".equalsIgnoreCase(fontFamily)) {
            return "Georgia";
        } else if ("Ultra".equalsIgnoreCase(fontFamily) || "Bungee".equalsIgnoreCase(fontFamily)) {
            return "Impact";
        }
        return "Courier New";
    }

    public static byte[] export(String title, String contentJson, String pageSize, String fontFamily) throws IOException {
        XWPFDocument document = new XWPFDocument();

        // Configure page margins and size
        try {
            CTSectPr sectPr = document.getDocument().getBody().addNewSectPr();
            CTPageMar pageMar = sectPr.addNewPgMar();
            pageMar.setLeft(java.math.BigInteger.valueOf(1440)); // 1 inch
            pageMar.setRight(java.math.BigInteger.valueOf(1440));
            pageMar.setTop(java.math.BigInteger.valueOf(1440));
            pageMar.setBottom(java.math.BigInteger.valueOf(1440));

            CTPageSz pageSz = sectPr.addNewPgSz();
            if ("letter".equalsIgnoreCase(pageSize)) {
                pageSz.setW(java.math.BigInteger.valueOf(12240)); // 8.5 * 1440
                pageSz.setH(java.math.BigInteger.valueOf(15840)); // 11 * 1440
            } else {
                pageSz.setW(java.math.BigInteger.valueOf(11907)); // A4: 8.27 * 1440
                pageSz.setH(java.math.BigInteger.valueOf(16838)); // A4: 11.69 * 1440
            }
        } catch (Exception e) {
            // Ignore margin config errors if schemas are lite
        }

        List<Map<String, Object>> elements = ScriptStatsCalculator.parseElements(contentJson);
        boolean hasTitlePage = false;
        
        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            if (ScreenplayElementType.TITLE_PAGE.name().equals(type)) {
                hasTitlePage = true;
                break;
            }
        }

        String docFont = getFontFamily(fontFamily);

        // Title Page
        if (!"script".equalsIgnoreCase(pageSize)) {
            if (hasTitlePage) {
                for (Map<String, Object> element : elements) {
                    String type = String.valueOf(element.get("type"));
                    if (ScreenplayElementType.TITLE_PAGE.name().equals(type)) {
                        String text = element.get("text") != null ? String.valueOf(element.get("text")) : "";
                        if (!text.isBlank()) {
                            if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
                                try {
                                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                                    @SuppressWarnings("unchecked")
                                    Map<String, Object> fields = mapper.readValue(text, Map.class);
                                    String movieTitle = fields.get("title") != null ? String.valueOf(fields.get("title")).toUpperCase() : "";
                                    String screenplay = fields.get("screenplay") != null ? String.valueOf(fields.get("screenplay")).toUpperCase() : "";
                                    String writer = fields.get("writer") != null ? String.valueOf(fields.get("writer")).toUpperCase() : "";
                                    String director = fields.get("director") != null ? String.valueOf(fields.get("director")).toUpperCase() : "";
                                    String aboveText = fields.get("aboveText") != null ? String.valueOf(fields.get("aboveText")) : "";
                                    String belowText = fields.get("belowText") != null ? String.valueOf(fields.get("belowText")) : "";

                                    for (int i = 0; i < 4; i++) {
                                        document.createParagraph();
                                    }

                                    if (!aboveText.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(12);
                                        String[] aboveLines = aboveText.split("\n");
                                        for (int j = 0; j < aboveLines.length; j++) {
                                            if (j > 0) {
                                                r = p.createRun();
                                                r.setFontFamily(docFont);
                                                r.setFontSize(12);
                                            }
                                            r.setText(aboveLines[j]);
                                            if (j < aboveLines.length - 1) {
                                                r.addCarriageReturn();
                                            }
                                        }
                                    }

                                    if (aboveText.isBlank()) {
                                        for (int i = 0; i < 2; i++) {
                                            document.createParagraph();
                                        }
                                    }

                                    if (!movieTitle.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(26);
                                        r.setBold(true);
                                        r.setText(movieTitle);
                                    }

                                    if (!director.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(20);
                                        r.setBold(true);
                                        r.setText(director);
                                    }

                                    if (!writer.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(16);
                                        r.setBold(true);
                                        r.setText(writer);
                                    }

                                    if (!screenplay.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(14);
                                        r.setBold(true);
                                        r.setText(screenplay);
                                    }

                                    if (!belowText.isBlank()) {
                                        XWPFParagraph p = document.createParagraph();
                                        p.setAlignment(ParagraphAlignment.CENTER);
                                        p.setSpacingAfter(480);
                                        XWPFRun r = p.createRun();
                                        r.setFontFamily(docFont);
                                        r.setFontSize(12);
                                        String[] belowLines = belowText.split("\n");
                                        for (int j = 0; j < belowLines.length; j++) {
                                            if (j > 0) {
                                                r = p.createRun();
                                                r.setFontFamily(docFont);
                                                r.setFontSize(12);
                                            }
                                            r.setText(belowLines[j]);
                                            if (j < belowLines.length - 1) {
                                                r.addCarriageReturn();
                                            }
                                        }
                                    }

                                } catch (Exception e) {
                                    for (int i = 0; i < 10; i++) {
                                        document.createParagraph();
                                    }
                                    XWPFParagraph p = document.createParagraph();
                                    p.setAlignment(ParagraphAlignment.CENTER);
                                    p.setSpacingAfter(0);
                                    String[] lines = text.split("\n");
                                    for (int j = 0; j < lines.length; j++) {
                                        XWPFRun run = p.createRun();
                                        run.setFontFamily(docFont);
                                        run.setFontSize(12);
                                        run.setText(lines[j]);
                                        if (j < lines.length - 1) {
                                            run.addBreak();
                                        }
                                    }
                                }
                            } else {
                                for (int i = 0; i < 10; i++) {
                                    document.createParagraph();
                                }
                                XWPFParagraph p = document.createParagraph();
                                p.setAlignment(ParagraphAlignment.CENTER);
                                p.setSpacingAfter(0);
                                String[] lines = text.split("\n");
                                for (int j = 0; j < lines.length; j++) {
                                    XWPFRun run = p.createRun();
                                    run.setFontFamily(docFont);
                                    run.setFontSize(12);
                                    run.setText(lines[j]);
                                    if (j < lines.length - 1) {
                                        run.addBreak();
                                    }
                                }
                            }
                        }
                    }
                }
                // Only create a new page if there are actually elements in the script body to render
                boolean hasContent = false;
                for (Map<String, Object> element : elements) {
                    String type = String.valueOf(element.get("type"));
                    if (!ScreenplayElementType.TITLE_PAGE.name().equals(type)
                            && !ScreenplayElementType.SYNOPSIS.name().equals(type)
                            && !ScreenplayElementType.BEAT.name().equals(type)) {
                        String rawText = element.get("text") != null ? String.valueOf(element.get("text")) : "";
                        if (!rawText.isBlank()) {
                            hasContent = true;
                            break;
                        }
                    }
                }
                if (hasContent) {
                    XWPFParagraph breakP = document.createParagraph();
                    breakP.setPageBreak(true);
                }
            }
        }

        // Script content
        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            if (ScreenplayElementType.TITLE_PAGE.name().equals(type)) {
                continue; 
            }
            
            String text = element.get("text") != null ? String.valueOf(element.get("text")) : "";
            if (text.isBlank()) {
                continue;
            }

            XWPFParagraph paragraph = document.createParagraph();
            paragraph.setSpacingAfter(6);

            XWPFRun run = paragraph.createRun();
            run.setFontFamily(docFont);
            run.setFontSize(12);
            run.setText(text);

            if (ScreenplayElementType.SCENE_HEADING.name().equals(type)) {
                run.setBold(true);
                paragraph.setSpacingBefore(12);
            } else if (ScreenplayElementType.CHARACTER.name().equals(type)) {
                paragraph.setIndentationLeft(2880); // 2 inches
                paragraph.setSpacingBefore(12);
            } else if (ScreenplayElementType.DIALOGUE.name().equals(type)) {
                paragraph.setIndentationLeft(1440); // 1 inch
                paragraph.setIndentationRight(2160); // 1.5 inches
            } else if (ScreenplayElementType.PARENTHETICAL.name().equals(type)) {
                paragraph.setIndentationLeft(2160); // 1.5 inches
                paragraph.setIndentationRight(2880); // 2 inches
            } else if (ScreenplayElementType.TRANSITION.name().equals(type)) {
                paragraph.setAlignment(ParagraphAlignment.RIGHT);
                paragraph.setSpacingBefore(12);
            } else {
                paragraph.setSpacingBefore(6);
            }
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        document.write(outputStream);
        document.close();
        return outputStream.toByteArray();
    }
}
