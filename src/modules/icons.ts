const iconsList = JSON.parse(JSON.stringify({
  icons: {
    app: 'fluent-apps-24-regular', //
    image: 'fluent-image-24-regular', //
    compressed: 'fluent-folder-zip-24-regular', //
    pdf: 'fluent-document-pdf-24-regular', //
    word: 'fluent-document-bullet-list-24-regular', //
    powerpoint: 'fluent-slide-multiple-24-regular', //
    excel: 'fluent-document-table-24-regular', //
    generic: 'fluent-document-24-regular', //
    video: 'fluent-video-clip-24-regular', //
    music: 'fluent-music-note-1-24-regular', //
    font: 'fluent-text-font-20-regular' //
  },
  MimeTypeArray: {
    application: 'generic',
    audio: 'music',
    font: 'font',
    image: 'image',
    message: 'generic',
    model: 'generic',
    multipart: 'generic',
    text: 'generic',
    video: 'video'
  },
  MimeFileMatcher: {
    pdf: 'pdf',
    zip: 'compressed',
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
    'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
    'vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint'
  }
}))

export function MatchIcon (filetype: string) {
  const ftype = filetype.split('/')
  const icon = iconsList.icons[iconsList.MimeFileMatcher[ftype[1]]] || iconsList.icons[iconsList.MimeTypeArray[ftype[0]]] || iconsList.icons.generic
  return icon
}
