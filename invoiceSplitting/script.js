


['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js', 
 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 
 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js']
.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
});




// this is a helper function which gets used in buildZip
async function extractPageRange(pdfDoc,startPage,endPage){
    // Create a new PDF document for the extracted pages
    const newPdf = await PDFLib.PDFDocument.create()

    // Copy the pages into the new PDF document
    for (let i = startPage - 1; i < Math.min(endPage,pdfDoc.getPageCount()); i++){
        newPdf.addPage((await newPdf.copyPages(pdfDoc,[i]))[0])
    }
    return await newPdf.save()
}

// this is the main function which needs to be imported
async function main(file){
    const pdf = await pdfjsLib.getDocument(new Uint8Array(event.target.result)).promise
    let names = []
    let pageNums = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++){
    // for (let pageNum = pdf.numPages-2; pageNum <= pdf.numPages-2; pageNum++){
        let textContent = ''
        const text = await (await pdf.getPage(pageNum)).getTextContent();
        text.items.forEach(item => {textContent += item.str + '\n'});
        postalIndices = []
        let Q = textContent.split('\n')
        for (let i=0; i<Q.length; i++){
            let q = Q[i]
            let l = q.length
            if (l>=7 && q[l-4]==' '){
                if (/^[A-Z]+$/.test(q[l-2]+q[l-5]+q[l-7]) && /^\d+$/.test(q[l-1]+q[l-3]+q[l-6])) postalIndices.push(i)
            }
        }
        postalIndices.shift()
        let shipto = ''
        for (let i=postalIndices[0]+1; i<=postalIndices[1]; i++){
            shipto += Q[i]+' '
        }

        console.log(textContent)

        shipto = shipto.replace("/", "")

        // length is 2 if the page contains an invoice number
        // that is to say, it is the start of a new invoice
        let x = textContent.split('Invoice Number')
        if (x.length == 2){
            let y = x[1].split('Account Number:')
            if (y.length<2) return ''
            let acc = y[1].split('\n')[0].substring(1)
            // if (x[0].split('Ship-to').length == 1) shipto = ''
            let name = acc+'-'+shipto+'.pdf'
            names.push(name)
            pageNums.push(pageNum)
        }
    }
    if (names.length == 0) return ''

    // console.log('pdf names: ',names)
    // return ''

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer)

    // Create a new ZIP file using JSZip
    const zip = new JSZip()

    let end = pageNums.slice(1)
    end.push(pdf.numPages+1)
    let pages = []
    for (let i=0; i<end.length; i++) pages[i] = [pageNums[i],end[i]-1]

    for (let i=0; i<names.length; i++){
    // for (let i=names.length-1; i<names.length; i++){
        zip.file(names[i],await extractPageRange(pdfDoc,pages[i][0],pages[i][1]))
    }

    return zip
}



