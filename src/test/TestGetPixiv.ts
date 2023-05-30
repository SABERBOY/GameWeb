// Description: Test get pixiv url from github
// import axios from "axios";
import fetch from 'node-fetch';
// import HttpsProxyAgent from 'https-proxy-agent';
import probe from 'probe-image-size';
import truncate from 'truncate-utf8-bytes';
import { extname, basename } from 'path';
const pixivUrl = "https://github.com/SABERBOY/PixivGenerator/raw/pixiv/pixiv/url.json"

export function trimFilenameToBytes(filename: string, maxBytes: number = 255) {
  // By extracting the file extension from the filename,
  // it'll trim "verylong.pdf" to "verylo.pdf" and not "verylong.p"
  const ext = extname(filename);
  const base = basename(filename, ext);
  const length = Buffer.byteLength(ext);
  const shorter = truncate(base, Math.max(0, maxBytes - length)) + ext;
  // Just in case the file extension's length is more than maxBytes.
  return truncate(shorter, maxBytes);
}

export interface IPixivJson {
  pixiv: string[];
}
export interface IPixivPicJson {
  pixiv_pic: IPixivPic[];
}

export interface IPixivPic {
  name: string;
  path: string;
  index: number;
  user: string;
  ext: IEXT;
}

export enum IEXT {
  Jpg = ".jpg",
  PNG = ".png",
}


export async function getPixivJson(): Promise<IPixivJson> {
  let headersList = {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)"
  };
  // const proxyAgent = HttpsProxyAgent('http://127.0.0.1:10900');
  let response = await fetch(pixivUrl, {
    method: "GET",
    headers: headersList,
    // agent: proxyAgent
  });

  let data = await response.text();
  const returnData: IPixivJson = {
    pixiv: JSON.parse(data).pixiv,
  };
  //returnData.pixiv = [returnData.pixiv[0]]
  console.log(returnData);
  return returnData;
}

export async function getPixivPicJson(url: string): Promise<IPixivPicJson> {
  let headersList = {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)"
  };
  // const proxyAgent = HttpsProxyAgent('http://127.0.0.1:10900');
  let response = await fetch(url, {
    method: "GET",
    headers: headersList,
    // agent: proxyAgent
  });

  let data = await response.text();
  const returnData: IPixivPicJson = (JSON.parse(data) as IPixivPicJson);
  // console.log('length:', returnData.pixiv_pic.length);

  /* if (returnData.pixiv_pic.length > 0) {
    const picUrl = returnData.pixiv_pic[0];
    returnData.pixiv_pic = [picUrl]
    return returnData;
  } */
  // console.log("returnData:",returnData);
  return returnData;
}

export async function getPixivImages() {
  const pp = await getPixivJson();
  const url = pixivUrl;
  const images = await Promise.all(pp.pixiv.map(async (value: string) => {
    const pixivPicUrlJson = url.replace("url.json", "") + value.replace("./pixiv/", "")
    const picUrlJson = await getPixivPicJson(pixivPicUrlJson);
    const picUrl = picUrlJson.pixiv_pic;

    return await Promise.all(picUrl.map(async (picData) => {
      const pixivPicId = picData.name;
      const fileName = pixivPicId + picData.ext;
      const picUrl = pixivPicUrlJson.replace("pixiv_pic.json", "") + fileName;
      const picTipAndAuthor = picData.user
      const href = picUrl;
      return { label: picTipAndAuthor, href, size: undefined as unknown as probe.ProbeResult };
    }))
  }))

  const imagesList: { label: string | undefined; href: string; size: probe.ProbeResult; }[] = []
  /* images.map((value) => {
    value.map(async (value1) => {
      // if (imagesList.length <=0)
      console.log("href:", value1.href);
      const size: probe.ProbeResult = await probe(encodeURI(value1.href));
      value1.size = size
      imagesList.push(value1)
    })
  }) */
  let index = 0;
  for await (const value of images) {
    for await (const value1 of value) {
      if (index >= 500) break;
      console.log("downloading:", value1.href);
      const size: probe.ProbeResult = await probe((value1.href));
      index++;
      value1.size = size
      imagesList.push(value1)
    }
  }
  return imagesList;

}


/* const images = await getPixivImages();
console.log(images.length);

images.map((image) => {
  console.log("image:", image);
}) */


