import { writeFileSync } from "fs";
import { Configuration, BlocksApi } from "@stacks/blockchain-api-client";

let list = [];
let thread = 500;
const rpcUrl = "https://api.hiro.so"

const apiConfig = new Configuration({
    fetchApi: fetch,
    basePath: rpcUrl
})
const blocksApi = new BlocksApi(apiConfig);

async function getSTXHeight(){
    const res = await blocksApi.getBlockList({limit:1});
    return res.results[0].height;
}

async function handleNumber(number){
    const url = 'https://api.stx20.com/api/v1/stxmap/' + number;
    const res = await fetch(url);
    if (res.status === 200) {
        const json = await res.json();
        if(list[json.data.owner]){
            list[json.data.owner].push(number);
        } else {
            list[json.data.owner] = [number];
        }
        console.log(`编号: ${number} , 地址: ${json.data.owner} , 成员数: ${list[json.data.owner].length}`)
    } else {
        console.log(`编号: ${number} 未使用`)
    }
}

async function main(){
    let promises = [];
    const total = await getSTXHeight();
    for (let index = 1; index < total; index ++) {
        const promise = (async () => {
            await handleNumber(index);
        })();

        promises.push(promise)

        if (promises.length >= thread) {
            await Promise.all(promises)
            promises.length = 0;
        }
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }


    let result = []
    let keys = Object.keys(list);
    keys.forEach((key,index)=>{
        result.push({address:key,count:list[key].length})
    })

    const arr = result.sort((a,b)=>{
        return b.count - a.count;
    });
    let all = 0;
    arr.forEach((item,index)=>{
        all += item.count;
        if (index < 3000) {
            console.log(`${index + 1}  地址: ${item.address}  数量: ${item.count}`)
        }
    })
    console.log(`总数: ${all}  持币地址数: ${result.length}`)
    await writeFileSync('./list.json', JSON.stringify(arr));

}
await main();






