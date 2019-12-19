import { AxiosResponse } from 'axios'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

export abstract class BaseProvider {
  private getFilename (response: AxiosResponse<Readable>): string {
    const headerNames = Object.keys(response.headers)
    const headerIndex = headerNames.map(h => h.toLowerCase()).indexOf('content-disposition')
    const contentDispositionHeader = response.headers[headerNames[headerIndex]] as string
    const regexFilename = /filename="(.+)"/g
    const regexResult = regexFilename.exec(contentDispositionHeader)

    if (regexResult) {
      return decodeURIComponent(regexResult[1])
    }

    return 'Untitled.osz'
  }

  protected abstract async implementation (beatmapsetID: number, noVideo: boolean): Promise<AxiosResponse<Readable>>;

  public async download (beatmapsetID: number, downloadFolder: string, noVideo: boolean): Promise<void> {
    const response = await this.implementation(beatmapsetID, noVideo)
    const filename = this.getFilename(response)

    response.data.pipe(fs.createWriteStream(path.join(downloadFolder, filename)))

    return new Promise(resolve => {
      response.data.on('end', () => resolve())
    })
  }
}
