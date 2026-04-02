declare module 'mammoth/mammoth.browser' {
    export interface ConversionResult {
        value: string;
        messages: any[];
    }
    export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ConversionResult>;
    export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ConversionResult>;
}
