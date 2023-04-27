// Description: Test get pixiv url from github
// import axios from "axios";
import fetch from 'node-fetch';
// import HttpsProxyAgent from 'https-proxy-agent';
import probe from 'probe-image-size';
import truncate from 'truncate-utf8-bytes';
import { extname, basename } from 'path';

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
  url: string
}
export interface IPixivPicJson {
  pixiv_pic: string[];
  url: string
}

export async function getPixivJson(): Promise<IPixivJson> {
  const url = "https://github.com/SABERBOY/PixivGenerator/raw/pixiv/pixiv/url.json"
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
  const returnData: IPixivJson = {
    pixiv: JSON.parse(data).pixiv,
    url: url
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
  const returnData: IPixivPicJson = {
    pixiv_pic: JSON.parse(data).pixiv_pic,
    url: url
  };
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
  const url = pp.url;
  const images = await Promise.all(pp.pixiv.map(async (value: string) => {
    const pixivPicUrlJson = url.replace("url.json", "") + value.replace("./pixiv/", "")
    const picUrlJson = await getPixivPicJson(pixivPicUrlJson);
    const picUrl = picUrlJson.pixiv_pic;
    return await Promise.all(picUrl.map(async (value1: string) => {
      const pic = url.replace("url.json", "") + value1.replace("./pixiv/", "")
      const fileName = pic.substring(pic.lastIndexOf('/') + 1)
      const pixivPicId = fileName.split('_')[0]
      const picTipAndAuthor = fileName.replace(pixivPicId + "_", "").split("-by-")
      const picTipLabel = picTipAndAuthor[0]
      const href = pic;
      // const fileNameSave: string = index + ""
      // const urlName = size.url;
      // size.url = trimFilenameToBytes(urlName)
      // console.log("size:", size);
      return { label: picTipLabel, href, size: undefined as unknown as probe.ProbeResult };
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

  for await (const value of images) {
    for await (const value1 of value) {
      console.log("downloading:", value1.href);
      const size: probe.ProbeResult = await probe(encodeURI(value1.href));
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


