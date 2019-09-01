import fs from "fs";
import path from "path";
import util from "util";

import { Tracker } from "./Tracker";

import { MarketBoardItemListing } from "../models/MarketBoardItemListing";
import { MarketInfoLocalData } from "../models/MarketInfoLocalData";

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const writeFile = util.promisify(fs.writeFile);

export class PriceTracker extends Tracker {
    // The path structure is /listings/<worldID/<itemID>/<branchNumber>.json
    constructor() {
        super("../../data", ".json");

        const worlds = fs.readdirSync(path.join(__dirname, this.storageLocation));
        for (let world of worlds) {
            const items = fs.readdirSync(path.join(__dirname, this.storageLocation, world));
            for (let item of items) {
                let listings: MarketInfoLocalData;
                try {
                    listings = JSON.parse(
                        fs.readFileSync(
                            path.join(__dirname, this.storageLocation, world, item, "0.json")
                        ).toString()
                    );
                } catch {
                    continue;
                }

                this.data.set(parseInt(item), { worldID: listings.worldID, data: listings.listings });
            }
        }
    }

    public async set(itemID: number, worldID: number, listings: MarketBoardItemListing[]) {
        const worldDir = path.join(__dirname, this.storageLocation, String(worldID));
        const itemDir = path.join(worldDir, String(itemID));
        const filePath = path.join(itemDir, "0.json");
        // const listings = (await readdir(filePath)).filter((el) => el.endsWith(".json"));

        if (!await exists(worldDir)) {
            await mkdir(worldDir);
        }

        if (!await exists(itemDir)) {
            await mkdir(itemDir);
        }

        let data: MarketInfoLocalData = {
            itemID,
            listings,
            worldID
        };

        if (await exists(filePath)) {
            data.recentHistory = JSON.parse((await readFile(filePath)).toString()).recentHistory;
        }

        await writeFile(filePath, JSON.stringify(data));

        /*const nextNumber = parseInt(
            listings[listings.length - 1].substr(0, listings[listings.length - 1].indexOf("."))
        ) + 1;

        await writeFile(path.join(filePath, `${nextNumber}.json`), JSON.stringify({
            listings: data,
        }));*/
    }
}
