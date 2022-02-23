// Upload a file to the server using messages over websocket/socketio
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

// How it works:
// - sends a start message to the server with the topic, the file name, and size
// - expects an OK/FAIL back
// - sends chunks
// - sends finished message

// Upload request/message payload:
// { id: upload_id, name: filename, size: in_bytes, type: mime_type, offset: of_this_chunk,
//   last: is_last_chunk_bool, data: chunk_data }

var upload_id = 1000

export default function (topic, file, conn) {
    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    if (!file || !file.name || typeof file.size !== 'number') return

    const reader = new FileReader()
    const chunkSize = 128 * 1024
    let offset = 0
    let last = false
    let info = { id: upload_id++, name: file.name, size: file.size, type: file.type }

    // nextChunk initiates the read of the next chunk, FileReader will signal an onload event
    // when done
    function nextChunk() {
        if (offset < file.size) {
            let chunk = file.slice(offset, Math.min(offset+chunkSize, file.size))
            last = offset + chunkSize >= file.size
            reader.readAsArrayBuffer(chunk)
        }
    }

    // onload event called by FileReader, sends the chunk
    reader.onload = async (e) => {
        const data = e.target.result
        if (offset == 0) {
            // first offset gets sent as 'upstart' request so the server can accept/reject it
            // we expect a true/false response back
            try {
                let res = await conn.serverQuery(topic, { ...info, offset, last, data }, "upstart")
                if (!res) {
                    console.log('upload rejected')
                }
            } catch (err) {
                console.log('upload failed', err)
            }
        } else {
            conn.serverSend(topic, { ...info, offset, last, data }, "upcont")
            await timeout(100) // arbitrary delay to avoid flooding the connection
        }
        offset += data.byteLength
        nextChunk()
    }

    nextChunk()
}
