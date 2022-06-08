import axios from "axios";

export interface FileUploader {
  upload(data: string | Blob | File | Buffer): Promise<string>;
}

export class IPFSWebUploader implements FileUploader {
  async upload(data: string | Blob | File | Buffer): Promise<string> {
    const formData = new FormData();
    formData.append("file", data);

    // TODO does it get pinned?
    // TODO do we trust this to stay
    const { data: respData } = await axios.post(
      "https://ipfs.infura.io:5001/api/v0/add",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // TODO do we trust this to stay #2
    return `https://ipfs.io/ipfs/${respData.Hash}`;
  }
}
