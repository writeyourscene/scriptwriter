package com.scriptwriter.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.scriptwriter.enums.ScreenplayElementType;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

public final class ScreenplayPdfExporter {

    private ScreenplayPdfExporter() {}

    // ── Font caching ─────────────────────────────────────────────────────────
    // FontFactory.registerDirectories() scans all system font folders — very slow.
    // We call it exactly ONCE (lazy, thread-safe) and cache every resolved Font.
    private static final java.util.concurrent.atomic.AtomicBoolean FONTS_REGISTERED =
            new java.util.concurrent.atomic.AtomicBoolean(false);
    private static final java.util.concurrent.ConcurrentHashMap<String, Font> FONT_CACHE =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static void ensureFontsRegistered() {
        if (FONTS_REGISTERED.compareAndSet(false, true)) {
            FontFactory.registerDirectories();
        }
    }

    // ── Bundled font loader ──────────────────────────────────────────────────
    // Courier Prime TTF files are stored in src/main/resources/fonts/
    // and are embedded into the JAR at build time. We load them once and
    // cache the BaseFont objects so we never pay the IO cost twice.
    private static final java.util.Map<String, BaseFont> BASE_FONT_CACHE =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static Font getFont(String fontFamily, float size, int style) {
        String cacheKey = fontFamily + "_" + size + "_" + style;
        Font cached = FONT_CACHE.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        Font resolved = resolveFont(fontFamily, size, style);
        FONT_CACHE.put(cacheKey, resolved);
        return resolved;
    }

    private static BaseFont loadCourierPrimeBase(String resourceName) {
        return BASE_FONT_CACHE.computeIfAbsent(resourceName, key -> {
            try (java.io.InputStream is =
                         ScreenplayPdfExporter.class.getResourceAsStream("/fonts/" + key)) {
                if (is == null) return null;
                byte[] bytes = is.readAllBytes();
                return BaseFont.createFont(key, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, bytes, null);
            } catch (Exception e) {
                return null;
            }
        });
    }

    /** Returns the right Courier Prime TTF filename for a given iText style flag. */
    private static String courierPrimeTtfName(int style) {
        boolean bold   = (style & Font.BOLD)   != 0;
        boolean italic = (style & Font.ITALIC)  != 0;
        if (bold && italic) return "CourierPrime-BoldItalic.ttf";
        if (bold)           return "CourierPrime-Bold.ttf";
        if (italic)         return "CourierPrime-Italic.ttf";
        return "CourierPrime-Regular.ttf";
    }

    private static Font resolveFont(String fontFamily, float size, int style) {
        try {
            // ── Courier Prime / Courier New / Special Elite: use bundled TTF ──
            if ("Courier Prime".equalsIgnoreCase(fontFamily)
                    || "Courier New".equalsIgnoreCase(fontFamily)
                    || "Special Elite".equalsIgnoreCase(fontFamily)) {
                String ttf = courierPrimeTtfName(style);
                BaseFont bf = loadCourierPrimeBase(ttf);
                if (bf != null) {
                    return new Font(bf, size, Font.NORMAL); // style is baked into filename
                }
                return FontFactory.getFont(FontFactory.COURIER, size, style);
            }

            // ── Other fonts: try system fonts via FontFactory ────────────────
            String pdfFontName;
            if ("Cinzel".equalsIgnoreCase(fontFamily)) {
                pdfFontName = "Times New Roman";
            } else if ("Space Mono".equalsIgnoreCase(fontFamily)) {
                pdfFontName = "Consolas";
            } else if ("IM Fell English".equalsIgnoreCase(fontFamily)) {
                pdfFontName = "Georgia";
            } else if ("Ultra".equalsIgnoreCase(fontFamily)
                    || "Bungee".equalsIgnoreCase(fontFamily)) {
                pdfFontName = "Impact";
            } else {
                pdfFontName = FontFactory.COURIER;
            }

            ensureFontsRegistered();

            if (FontFactory.isRegistered(pdfFontName)) {
                return FontFactory.getFont(pdfFontName, BaseFont.CP1252, BaseFont.EMBEDDED, size, style);
            }

            if ("Times New Roman".equalsIgnoreCase(pdfFontName) || "Georgia".equalsIgnoreCase(pdfFontName)) {
                return FontFactory.getFont(FontFactory.TIMES_ROMAN, size, style);
            } else if ("Impact".equalsIgnoreCase(pdfFontName)) {
                return FontFactory.getFont(FontFactory.HELVETICA_BOLD, size, style);
            } else if ("Consolas".equalsIgnoreCase(pdfFontName)) {
                return FontFactory.getFont(FontFactory.COURIER, size, style);
            }

            return FontFactory.getFont(FontFactory.COURIER, size, style);
        } catch (Exception e) {
            return FontFactory.getFont(FontFactory.COURIER, size, style);
        }
    }

    private static class PageNumberEvent extends PdfPageEventHelper {
        private final String fontFamily;
        private final String watermarkText;
        private final boolean isScript;
        private final boolean hasTitlePage;

        public PageNumberEvent(String fontFamily, String watermarkText, boolean isScript, boolean hasTitlePage) {
            this.fontFamily = fontFamily;
            this.watermarkText = watermarkText;
            this.isScript = isScript;
            this.hasTitlePage = hasTitlePage;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            int pageNumber = writer.getPageNumber();
            if (!isScript && pageNumber > 1) {
                try {
                    String text = (pageNumber - 1) + ".";
                    PdfContentByte cb = writer.getDirectContent();

                    // Bold page number — matching .page-number-label { font-weight: 700 }
                    Font resolvedFont = getFont(fontFamily, 15, Font.BOLD);
                    BaseFont bf = resolvedFont.getBaseFont();
                    if (bf == null) {
                        bf = BaseFont.createFont(BaseFont.COURIER_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                    }

                    cb.beginText();
                    cb.setFontAndSize(bf, 15);
                    float x = document.right();
                    float y = document.top() + 36;
                    cb.showTextAligned(Element.ALIGN_RIGHT, text, x, y, 0);
                    cb.endText();
                } catch (Exception e) {
                    // Ignore exception
                }
            }

            // Draw watermark if provided
            if (watermarkText != null && !watermarkText.trim().isEmpty()) {
                // Skip the watermark on Page 1 if it is a title page
                if (pageNumber == 1 && hasTitlePage) {
                    return;
                }
                try {
                    PdfContentByte cb = writer.getDirectContentUnder();
                    cb.saveState();
                    cb.beginText();

                    BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                    cb.setFontAndSize(bf, 60);
                    cb.setRGBColorFill(180, 180, 180);

                    com.lowagie.text.pdf.PdfGState gstate = new com.lowagie.text.pdf.PdfGState();
                    gstate.setFillOpacity(0.08f); // 8% opacity
                    cb.setGState(gstate);

                    float x = (document.left() + document.right()) / 2;
                    float y = (document.top() + document.bottom()) / 2;
                    cb.showTextAligned(Element.ALIGN_CENTER, watermarkText.toUpperCase(), x, y, 45);

                    cb.endText();
                    cb.restoreState();
                } catch (Exception e) {
                    // Ignore watermark exception
                }
            }
        }
    }

    private static float getMarginBefore(String type) {
        if (ScreenplayElementType.SCENE_HEADING.name().equals(type)
                || ScreenplayElementType.CHARACTER.name().equals(type)
                || ScreenplayElementType.TRANSITION.name().equals(type)
                || ScreenplayElementType.SHOT.name().equals(type)) {
            return 18f;
        }
        return 0f;
    }

    private static float getMarginAfter(String type) {
        if (ScreenplayElementType.SCENE_HEADING.name().equals(type)
                || ScreenplayElementType.ACTION.name().equals(type)
                || ScreenplayElementType.DIALOGUE.name().equals(type)
                || ScreenplayElementType.TRANSITION.name().equals(type)
                || ScreenplayElementType.SHOT.name().equals(type)
                || ScreenplayElementType.LYRICS.name().equals(type)
                || ScreenplayElementType.NOTE.name().equals(type)) {
            return 9f;
        }
        return 0f;
    }

    /**
     * Returns true if the element has a pageBreakBefore flag set to true.
     */
    private static boolean hasPageBreakBefore(Map<String, Object> element) {
        Object flag = element.get("pageBreakBefore");
        if (flag instanceof Boolean) {
            return (Boolean) flag;
        }
        if (flag instanceof String) {
            return "true".equalsIgnoreCase((String) flag);
        }
        return false;
    }

    /**
     * Returns a plain Chunk with normal fill-only text rendering.
     * Previously used fill+stroke mode but that looked wrong on mobile PDF viewers.
     * Now that Courier Prime is embedded with proper Bold/Italic variants, no hack is needed.
     */
    private static Chunk semiBoldChunk(String text, Font font) {
        return new Chunk(text, font);
    }

    /**
     * Overloaded export method for backward compatibility.
     */
    public static byte[] export(String title, String contentJson, String pageSize, String fontFamily) throws DocumentException {
        return export(title, contentJson, pageSize, fontFamily, null);
    }

    public static byte[] export(String title, String contentJson, String pageSize, String fontFamily, String watermarkText) throws DocumentException {
        boolean isScript = "script".equalsIgnoreCase(pageSize);
        boolean isLetter = "letter".equalsIgnoreCase(pageSize);

        // Determine PDF page format
        Rectangle pageFormat;
        if (isScript) {
            // For "script" mode — use a very long page (continuous scroll, no automatic page breaks)
            pageFormat = new Rectangle(612f, 5000f); // US Letter width, very tall
        } else if (isLetter) {
            pageFormat = PageSize.LETTER;
        } else {
            pageFormat = PageSize.A4;
        }

        // Margins mapped to match frontend editor exactly (padding: 72px 80px)
        // Left/Right: 80px = 60pt, Top/Bottom: 72px = 54pt
        Document document = new Document(pageFormat, 60, 60, 54, 54);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        List<Map<String, Object>> elements = ScriptStatsCalculator.parseElements(contentJson);
        boolean hasTitlePage = false;

        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            if (ScreenplayElementType.TITLE_PAGE.name().equals(type)) {
                hasTitlePage = true;
                break;
            }
        }

        // Add page events handler
        writer.setPageEvent(new PageNumberEvent(fontFamily, watermarkText, isScript, hasTitlePage));

        document.open();

        Font normalFont = getFont(fontFamily, 15, Font.NORMAL);
        Font boldFont = getFont(fontFamily, 15, Font.BOLD);
        Font titleFont = getFont(fontFamily, 44, Font.BOLD);

        // ── Title page ──────────────────────────────────────────────────────────
        if (!isScript) {
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
                                    Map<String, String> fields = mapper.readValue(text, Map.class);
                                    String movieTitle = fields.getOrDefault("title", "").toUpperCase();
                                    String screenplay = fields.getOrDefault("screenplay", "").toUpperCase();
                                    String writerText = fields.getOrDefault("writer", "").toUpperCase();
                                    String director = fields.getOrDefault("director", "").toUpperCase();
                                    String aboveText = fields.getOrDefault("aboveText", "");
                                    String belowText = fields.getOrDefault("belowText", "");

                                    float gap = 16f; // spacingAfter between fields

                                    // Usable page height
                                    float usableHeight = document.getPageSize().getHeight() - document.topMargin() - document.bottomMargin();

                                    // Create a full-height table for perfect vertical centering
                                    com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(1);
                                    table.setWidthPercentage(100);
                                    com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell();
                                    cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                                    cell.setMinimumHeight(usableHeight - 20f);
                                    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);

                                    // ── Render fields into the cell ──
                                    if (!aboveText.isBlank()) {
                                        Font aFont = getFont(fontFamily, 16, Font.NORMAL);
                                        Paragraph p = new Paragraph(aboveText, aFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setLeading(19.2f);
                                        p.setSpacingAfter(gap);
                                        cell.addElement(p);
                                    }

                                    if (!movieTitle.isBlank()) {
                                        Font tFont = getFont(fontFamily, 44, Font.BOLD);
                                        Paragraph p = new Paragraph(movieTitle, tFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setSpacingAfter(gap);
                                        cell.addElement(p);
                                    }

                                    if (!director.isBlank()) {
                                        Font dFont = getFont(fontFamily, 28, Font.BOLD);
                                        Paragraph p = new Paragraph(director, dFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setSpacingAfter(gap);
                                        cell.addElement(p);
                                    }

                                    if (!writerText.isBlank()) {
                                        Font wFont = getFont(fontFamily, 24, Font.BOLD);
                                        Paragraph p = new Paragraph(writerText, wFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setSpacingAfter(gap);
                                        cell.addElement(p);
                                    }

                                    if (!screenplay.isBlank()) {
                                        Font sFont = getFont(fontFamily, 20, Font.BOLD);
                                        Paragraph p = new Paragraph(screenplay, sFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setSpacingAfter(gap);
                                        cell.addElement(p);
                                    }

                                    if (!belowText.isBlank()) {
                                        Font bFont = getFont(fontFamily, 16, Font.NORMAL);
                                        Paragraph p = new Paragraph(belowText, bFont);
                                        p.setAlignment(Element.ALIGN_CENTER);
                                        p.setLeading(19.2f);
                                        cell.addElement(p); // last element doesn't need spacingAfter
                                    }

                                    table.addCell(cell);
                                    document.add(table);
                                } catch (Exception e) {
                                    // Fallback: center with table
                                    float usableH = document.getPageSize().getHeight() - document.topMargin() - document.bottomMargin();
                                    com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(1);
                                    table.setWidthPercentage(100);
                                    com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell();
                                    cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                                    cell.setMinimumHeight(usableH - 20f);
                                    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
                                    
                                    Paragraph titlePagePara = new Paragraph(text, normalFont);
                                    titlePagePara.setAlignment(Element.ALIGN_CENTER);
                                    titlePagePara.setLeading(16f);
                                    cell.addElement(titlePagePara);
                                    
                                    table.addCell(cell);
                                    document.add(table);
                                }
                            } else {
                                // Plain text title page
                                float usableH = document.getPageSize().getHeight() - document.topMargin() - document.bottomMargin();
                                com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(1);
                                table.setWidthPercentage(100);
                                com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell();
                                cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                                cell.setMinimumHeight(usableH - 20f);
                                cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
                                
                                Paragraph titlePagePara = new Paragraph(semiBoldChunk(text, normalFont));
                                titlePagePara.setAlignment(Element.ALIGN_CENTER);
                                titlePagePara.setLeading(16f);
                                cell.addElement(titlePagePara);
                                
                                table.addCell(cell);
                                document.add(table);
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
                    document.newPage(); // Start script content on a fresh page after title page
                }
            }
        }

        // ── Script body ──────────────────────────────────────────────────────────
        int sceneCounter = 0;
        boolean firstContentElement = true;
        String prevType = null;

        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));

            // Skip title page elements — already rendered above
            if (ScreenplayElementType.TITLE_PAGE.name().equals(type)) {
                continue;
            }
            // Skip synopsis/beat/note in PDF output
            if (ScreenplayElementType.SYNOPSIS.name().equals(type)
                    || ScreenplayElementType.BEAT.name().equals(type)) {
                continue;
            }

            String rawText = element.get("text") != null ? String.valueOf(element.get("text")) : "";
            if (rawText.isBlank()) {
                continue;
            }

            // ── Page break handling ──────────────────────────────────────────────
            // If the element carries pageBreakBefore=true AND we're in a paginated format,
            // insert a hard page break (exactly as the user sees in the editor).
            if (!isScript && !firstContentElement && hasPageBreakBefore(element)) {
                document.newPage();
                firstContentElement = true;
            }

            // ── Element rendering ─────────────────────────────────────────────────────────────────
            // Leading = font-size × line-height = 15pt × 1.2 = 18.0pt (matches CSS exactly)
            final float LINE_HEIGHT = 18.0f;
            float spacingBefore;

            if (firstContentElement) {
                // First element on page: just use the element's own margin-top
                spacingBefore = getMarginBefore(type);
                firstContentElement = false;
            } else {
                float prevMarginAfter = getMarginAfter(prevType);
                float currentMarginBefore = getMarginBefore(type);
                spacingBefore = Math.max(prevMarginAfter, currentMarginBefore);
            }
            prevType = type;

            if (ScreenplayElementType.SCENE_HEADING.name().equals(type)) {
                sceneCounter++;
                String sceneText = rawText.toUpperCase();

                // Single Paragraph — Courier is monospace so "%2d " is always 3 chars wide (3 × 7.2pt = 21.6pt)
                // This keeps the scene number and heading text together as one unit that moves left/right together.
                String numPrefix = String.format("%d ", sceneCounter); // "1 ", "10 ", "100 "
                Paragraph heading = new Paragraph();
                heading.add(new Chunk(numPrefix, boldFont));
                heading.add(new Chunk(sceneText, boldFont));
                heading.setLeading(LINE_HEIGHT);
                heading.setSpacingBefore(spacingBefore);
                heading.setSpacingAfter(0f);
                document.add(heading);

            } else if (ScreenplayElementType.ACTION.name().equals(type)) {
                // .block-action: full width, no bold, no extra margin-top
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(rawText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setIndentationLeft(18f); // aligns with scene heading text
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.CHARACTER.name().equals(type)) {
                // .block-character: uppercase, center, width: 60%, no bold
                String charText = rawText.toUpperCase();
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(charText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setAlignment(Element.ALIGN_CENTER);
                paragraph.setIndentationLeft(90f);  // (1 - 0.60) / 2 × 451pt = 90pt
                paragraph.setIndentationRight(90f);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.DIALOGUE.name().equals(type)) {
                // .block-dialogue: center, width: 70%, no bold
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(rawText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setAlignment(Element.ALIGN_CENTER);
                paragraph.setIndentationLeft(68f);  // (1 - 0.70) / 2 × 451pt ≈ 68pt
                paragraph.setIndentationRight(68f);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.PARENTHETICAL.name().equals(type)) {
                // .block-parenthetical: center, width: 50%, no bold
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(rawText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setAlignment(Element.ALIGN_CENTER);
                paragraph.setIndentationLeft(113f); // (1 - 0.50) / 2 × 451pt ≈ 113pt
                paragraph.setIndentationRight(113f);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.TRANSITION.name().equals(type)) {
                // .block-transition: right-align, uppercase, full width
                String transText = rawText.toUpperCase();
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(transText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setAlignment(Element.ALIGN_RIGHT);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.SHOT.name().equals(type)) {
                // Shot: uppercase, left-aligned, semi-bold
                String shotText = rawText.toUpperCase();
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(shotText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.LYRICS.name().equals(type)) {
                // Lyrics: centered, italic, semi-bold
                Font italicFont = getFont(fontFamily, 15, Font.ITALIC);
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(rawText, italicFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setAlignment(Element.ALIGN_CENTER);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else if (ScreenplayElementType.NOTE.name().equals(type)) {
                // Note: italic, smaller, semi-bold
                Font italicFont = getFont(fontFamily, 14, Font.ITALIC);
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk("[[" + rawText + "]]", italicFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);

            } else {
                // Fallback action
                Paragraph paragraph = new Paragraph();
                paragraph.add(semiBoldChunk(rawText, normalFont));
                paragraph.setLeading(LINE_HEIGHT);
                paragraph.setSpacingBefore(spacingBefore);
                paragraph.setSpacingAfter(0f);
                document.add(paragraph);
            }
        }

        document.close();
        return outputStream.toByteArray();
    } // end export
}
