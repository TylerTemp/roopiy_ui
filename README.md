# Roopiy UI #

## Sqlite Project Data Struct ##

**config**

*   key: primary, string
*   value: string(json)


**frame**

*   filePath: primary, string, `frames/${filename}`
*   width: int
*   height: int
*   swappedTo: string | null, `swap/${filename}`

**frameFace**

*   id: primary, int
*   value: string(json)
*   frameFilePath: frame.filePath

**faceLib**

*   id: primary
*   value: string(json)
*   file: string, `face_lib/${filename}`
*   alias: string
*   hide: bool

**swap**

*   id: primary
*   frame_face_id: frame_face.id
*   face_lib_id: face_lib.id
