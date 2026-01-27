import { chromium, Cookie } from 'playwright'

/**
 * Renders a PDF from a given URL using Playwright.
 */
export async function generatePdfFromUrl(url: string, cookies?: Cookie[]): Promise<Buffer> {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        })

        if (cookies && cookies.length > 0) {
            await context.addCookies(cookies)
        }

        const page = await context.newPage()
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            displayHeaderFooter: false,
            margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
        })

        return Buffer.from(pdfBuffer)
    } finally {
        await browser.close()
    }
}

/**
 * Renders a PDF from an HTML string using Playwright.
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle' })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            displayHeaderFooter: false,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        })

        return Buffer.from(pdfBuffer)
    } finally {
        await browser.close()
    }
}
