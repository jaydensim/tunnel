onmessage = function (event) {
  console.log(event.data)
  const file = event.data
  const chunks = createChunks(file, 1024 * 1)
  /*
  while (startPointer < endPointer) {
    console.log('Done')
    const newStartPointer = startPointer + (1024 * 1)
    console.log('Done2')
    const slice = file.slice(startPointer, newStartPointer)
    console.log('Done3')
    slice.text().then(text => {
      console.log('Done3')
      chunks.push({
        slice: slice,
        text: text
      })
      console.log('Done5')
      startPointer = newStartPointer
      console.log('Done6')
    })
  }
  */
  console.log(chunks)
  postMessage({
    type: 1,
    length: chunks.length
  })
  chunks.forEach((chunk, index) => {
    setTimeout(() => {
      chunk.text().then(text => {
        postMessage({
          type: 2,
          chunk: chunk,
          text: text,
          num: index
        })
        if (index === (chunks.length - 1)) {
          postMessage({
            type: 3,
            num: chunks.length
          })
          console.log('Finished')
        }
      })
      chunk = null
    }, 3 * index)
  })
}

const createChunks = (file, cSize /* cSize should be byte 1024*1 = 1KB */) => {
  let startPointer = 0
  const endPointer = file.size
  const chunks = []
  while (startPointer < endPointer) {
    const newStartPointer = startPointer + cSize
    chunks.push(file.slice(startPointer, newStartPointer))
    startPointer = newStartPointer
  }
  return chunks
}
