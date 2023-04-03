// Description: Test get pixiv url from github
// import axios from "axios";
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';


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
  // console.log(returnData);
  return returnData;
}

export async function getPixivPicJson(url: string): Promise<IPixivPicJson> {
  let headersList = {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)"
  };
  const proxyAgent = HttpsProxyAgent('http://127.0.0.1:10900');
  let response = await fetch(url, {
    method: "GET",
    headers: headersList,
    agent: proxyAgent
  });

  let data = await response.text();
  const returnData: IPixivPicJson = {
    pixiv_pic: JSON.parse(data).pixiv_pic,
    url: url
  };
  // console.log(returnData);
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
      const size/* : probe.ProbeResult */ = {
        width: 512,
        height: 512,
        length: 0,
        type: '',
        mime: '',
        wUnits: '',
        hUnits: '',
        url: pic
      };
      // const picAuthor = picTipAndAuthor[1].split('.').pop();
      return { label: picTipLabel, href, size };
    }))
  }))

  const imagesList: { label: string | undefined; href: string; size: { width: number; height: number; length: number; type: string; mime: string; wUnits: string; hUnits: string; url: string; }; }[] = []
  images.map((value) => {
    value.map((value1) => {
      imagesList.push(value1)
    })
  })
  return imagesList;

}
/* const images = await getPixivImages();
console.log(images.length);

images.map((image) => {
  console.log("image:", image);
}) */


