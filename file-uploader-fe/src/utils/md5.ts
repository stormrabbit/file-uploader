import SparkMD5 from "spark-md5";

const CHUNK_SIZE = 2 * 1024 * 1024 // 2mb

export async function file2Md5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {

    const blobSlice = File.prototype.slice                           
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader();

    fileReader.onload = function (e) {
        console.log('read chunk nr', currentChunk + 1, 'of', chunks);
        spark.append(e?.target?.result as ArrayBuffer);                   // Append array buffer
        currentChunk++;

        if (currentChunk < chunks) {
            loadNext();
        } else {
            console.log('finished loading');
            const end = spark.end()
            console.info('computed hash', end);  // Compute hash
            resolve(end)
        }
    };

    fileReader.onerror = function () {
        console.warn('oops, something went wrong.');
        reject(new Error('文件 md5 值计算错误'))
    };

    function loadNext() {
        const start = currentChunk * CHUNK_SIZE,
            end = ((start + CHUNK_SIZE) >= file.size) ? file.size : start + CHUNK_SIZE;

        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();
    })
} 