import BN from "bn.js";
import { Address, beginCell, Cell, CommonMessageInfo, InternalMessage, StateInit, toNano, TonClient, Wallet, contractAddress, WalletContract, WalletV3R1Source, WalletV3R2Source, SendMode, CellMessage, Slice } from "ton";
import fs from "fs";
import { data } from "../contracts/jetton-wallet";
import { mnemonicToWalletKey } from "ton-crypto";
import { TransactionSender } from "./transaction-sender";
import { ContractDeployer } from "./contract-deployer";
const minterCode = "B5EE9C72410209010001AA000114FF00F4A413F4BCF2C80B0102016202030202CC040502037A60070801D5D9910E38048ADF068698180B8D848ADF07D201800E98FE99FF6A2687D007D206A6A18400AA9385D47181A9AA8AAE382F9702480FD207D006A18106840306B90FD001812881A28217804502A906428027D012C678B666664F6AA7041083DEECBEF0BDD71812F83C207F9784060093DFC142201B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064907C80383A6465816503E5FFE4E83BC00C646582AC678B28027D0109E5B589666664B8FD80400FC03FA00FA40F82854120870542013541403C85004FA0258CF1601CF16CCC922C8CB0112F400F400CB00C9F9007074C8CB02CA07CBFFC9D05008C705F2E04A12A1035024C85004FA0258CF16CCCCC9ED5401FA403020D70B01C3008E1F8210D53276DB708010C8CB055003CF1622FA0212CB6ACB1FCB3FC98042FB00915BE2007DADBCF6A2687D007D206A6A183618FC1400B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064FC80383A6465816503E5FFE4E840001FAF16F6A2687D007D206A6A183FAA9040F6B06B3C"; // "b5ee9c72c1020b010001ed000000000d00120018002a006b007000bc01390152016c0114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093b3f0508806e0a84026a8280790a009f404b19e2c039e2d99924591960225e801e80196019241f200e0e9919605940f97ff93a0ef003191960ab19e2ca009f4042796d625999992e3f60103efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804d02a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be2cc665c46";
const walletCode = "B5EE9C7241021101000319000114FF00F4A413F4BCF2C80B0102016202030202CC0405001BA0F605DA89A1F401F481F481A8610201D40607020148080900BB0831C02497C138007434C0C05C6C2544D7C0FC02F83E903E900C7E800C5C75C87E800C7E800C00B4C7E08403E29FA954882EA54C4D167C0238208405E3514654882EA58C4CD00CFC02780D60841657C1EF2EA4D67C02B817C12103FCBC2000113E910C1C2EBCB853600201200A0B0201200F1001F500F4CFFE803E90087C007B51343E803E903E90350C144DA8548AB1C17CB8B04A30BFFCB8B0950D109C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C032483E401C1D3232C0B281F2FFF274013E903D010C7E801DE0063232C1540233C59C3E8085F2DAC4F3208405E351467232C7C6600C02F13B51343E803E903E90350C01F4CFFE80145468017E903E9014D6B1C1551CDB1C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C0327E401C1D3232C0B281F2FFF274140331C146EC7CB8B0C27E8020822625A020822625A02806A8486544124E17C138C34975C2C070C00930802C200D0E008ECB3F5007FA0222CF165006CF1625FA025003CF16C95005CC07AA0013A08208989680AA008208989680A0A014BCF2E2C504C98040FB001023C85004FA0258CF1601CF16CCC9ED54006C5219A018A182107362D09CC8CB1F5240CB3F5003FA0201CF165007CF16C9718018C8CB0525CF165007FA0216CB6A15CCC971FB00103400828E2A820898968072FB028210D53276DB708010C8CB055008CF165005FA0216CB6A13CB1F13CB3FC972FB0058926C33E25502C85004FA0258CF1601CF16CCC9ED5400DB3B51343E803E903E90350C01F4CFFE803E900C145468549271C17CB8B049F0BFFCB8B0A0822625A02A8005A805AF3CB8B0E0841EF765F7B232C7C572CFD400FE8088B3C58073C5B25C60043232C14933C59C3E80B2DAB33260103EC01004F214013E809633C58073C5B3327B55200083200835C87B51343E803E903E90350C0134C7E08405E3514654882EA0841EF765F784EE84AC7CB8B174CFCC7E800C04E81408F214013E809633C58073C5B3327B55204F664B79"; // // "b5ee9c72c1021201000328000000000d001200220027002c00700075007a00ea016b01a801b101eb026902b802bd02c80114ff00f4a413f4bcf2c80b010201620302001ba0f605da89a1f401f481f481a8610202cc0f0402012006050083d40106b90f6a2687d007d207d206a1802698fc1080bc6a28ca9105d41083deecbef09dd0958f97162e99f98fd001809d02811e428027d012c678b00e78b6664f6aa40201200d07020120090800db3b51343e803e903e90350c01f4cffe803e900c145468549271c17cb8b049f0bffcb8b0a0822625a02a8005a805af3cb8b0e0841ef765f7b232c7c572cfd400fe8088b3c58073c5b25c60063232c14933c59c3e80b2dab33260103ec01004f214013e809633c58073c5b3327b552003f73b51343e803e903e90350c0234cffe80145468017e903e9014d6f1c1551cdb5c150804d50500f214013e809633c58073c5b33248b232c044bd003d0032c0327e401c1d3232c0b281f2fff274140371c1472c7cb8b0c2be80146a2860822625a020822625a004ad822860822625a028062849f8c3c975c2c070c008e00c0b0a0076c200b08e218210d53276db708010c8cb055008cf165004fa0216cb6a12cb1f12cb3fc972fb0093356c21e203c85004fa0258cf1601cf16ccc9ed54000e10491038375f0400705279a018a182107362d09cc8cb1f5230cb3f58fa025007cf165007cf16c9718018c8cb0524cf165006fa0215cb6a14ccc971fb001024102301f5503d33ffa00fa4021f001ed44d0fa00fa40fa40d4305136a1522ac705f2e2c128c2fff2e2c254344270542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c920f9007074c8cb02ca07cbffc9d004fa40f40431fa00778018c8cb055008cf1670fa0217cb6b13cc8210178d4519c8cb1f1980e009acb3f5007fa0222cf165006cf1625fa025003cf16c95005cc2391729171e25008a813a08208989680aa008208989680a0a014bcf2e2c504c98040fb001023c85004fa0258cf1601cf16ccc9ed540201d4111000113e910c1c2ebcb8536000bb0831c02497c138007434c0c05c6c2544d7c0fc03383e903e900c7e800c5c75c87e800c7e800c00b4c7e08403e29fa954882ea54c4d167c0278208405e3514654882ea58c511100fc02b80d60841657c1ef2ea4d67c02f817c12103fcbc20c2d0bee8";

// TODO temporary
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
axiosThrottle.use(axios, { requestsPerSecond: 0.9 }); // required since toncenter jsonRPC limits to 1 req/sec without API key

const JETTON_DEPLOY_GAS = toNano(0.4);

export enum JettonDeployState {
    NOT_STARTED,
    BALANCE_CHECK,
    UPLOAD_IMAGE,
    UPLOAD_METADATA,
    AWAITING_MINTER_DEPLOY,
    AWAITING_JWALLET_DEPLOY,
    VERIFY_MINT,
    ALREADY_DEPLOYED,
    DONE
}

export interface JettonDeployParams {
    jettonName: string,
    jettonSymbol: string;
    jettonIconImageData?: File // or Blob?
    jettonDescripton?: string,
    owner: Address,
    mintToOwner: boolean,
    amountToMint: BN,
    onProgress?: (state: JettonDeployState, error?: Error, msg?: string) => void
}

const sleep = async (time: number) => new Promise(resolve => { setTimeout(resolve, time); });

export async function waitForSeqno(wallet: Wallet) {
    const seqnoBefore = await wallet.getSeqNo();

    return async () => {
        for (let attempt = 0; attempt < 10; attempt++) {
            await sleep(3000);
            const seqnoAfter = await wallet.getSeqNo();
            if (seqnoAfter > seqnoBefore) return;
        }
        throw new Error("Timeout");
    };
}

export async function waitForContractDeploy(address: Address, client: TonClient) {
    let isDeployed = false;
    let maxTries = 10;
    while (!isDeployed && maxTries > 0) {
        maxTries--;
        isDeployed = await client.isContractDeployed(address);
        if (isDeployed) return;
        await sleep(3000);
    }
    throw new Error("Timeout");
}

class IPFSUploader {
    async upload(data: any): Promise<string> {
        const formData = new FormData();
        formData.append("file", data);

        // TODO does it get pinned?
        // TODO do we trust this to stay 
        const { data: respData } = await axios.post("https://ipfs.infura.io:5001/api/v0/add", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        // TODO do we trust this to stay #2
        return `https://ipfs.io/ipfs/${respData.Hash}`;
    }
}

export class JettonDeployController {
    #client: TonClient;
    #contractDeployer: ContractDeployer;
    #transactionSender: TransactionSender;
    #ipfsUploader: IPFSUploader;

    constructor(
        client: TonClient,
        contractDeployer: ContractDeployer,
        transactionSender: TransactionSender) {
        this.#client = client;
        this.#contractDeployer = contractDeployer;
        this.#transactionSender = transactionSender;
        this.#ipfsUploader = new IPFSUploader();
    }

    async createJetton(params: JettonDeployParams) {
        params.onProgress?.(JettonDeployState.BALANCE_CHECK);
        const balance = await this.#client.getBalance(params.owner);
        console.log(balance.toString());
        if (balance.lt(JETTON_DEPLOY_GAS)) throw new Error("Not enough balance in deployer wallet");

        // const ownerWallet = this.#client.openWalletFromAddress({ source: params.owner });

        const ipfsImageLink = await this.#ipfsUploader.upload(params.jettonIconImageData);
        const ipfsJsonLink = await this.#ipfsUploader.upload(JSON.stringify({
            "name": params.jettonName,
            "symbol": params.jettonSymbol,
            "description": params.jettonDescripton,
            "image": ipfsImageLink
        }));

        const deployParams = {
            code: Cell.fromBoc(minterCode)[0],
            data: JettonMinter.initData(params.owner, ipfsJsonLink),
            deployer: params.owner,
            value: toNano(0.25),
            message: JettonMinter.mintBody(
                params.owner,
                params.amountToMint
            ),
        };

        const contractAddr = this.#contractDeployer.addressForContract(deployParams);

        if ((await this.#client.isContractDeployed(contractAddr))) {
            params.onProgress?.(JettonDeployState.ALREADY_DEPLOYED);
        } else {
            try {
                await this.#contractDeployer.deployContract(
                    deployParams,
                    this.#transactionSender
                );
                params.onProgress?.(JettonDeployState.AWAITING_MINTER_DEPLOY);
                await waitForContractDeploy(contractAddr, this.#client);
            } catch (e) {
                // TODO deploy-specific errors
                throw e;
            }
        }

        const res = await this.#client.callGetMethod(
            contractAddr,
            "get_jetton_data"
        );

        const deployedOwnerAddress = (parseGetMethodCall(res.stack)[2] as Cell).beginParse().readAddress()!;
        if (deployedOwnerAddress.toFriendly() !== params.owner.toFriendly()) throw new Error("Contract deployed incorrectly");

        // const contentCell = (parseGetMethodCall(res.stack)[3] as Cell).beginParse();
        // contentCell.readInt(8);
        // console.log("contentURI:" + contentCell.readRemainingBytes().toString('ascii'))

        // let cell = new Cell();
        // cell.bits.writeAddress(params.owner);
        // // nodejs buffer
        // let b64dataBuffer = (await cell.toBoc({ idx: false })).toString("base64");
        // console.log(b64dataBuffer)


        // console.log(beginCell().storeAddress(params.owner).endCell().toBoc({ idx: false }).toString('base64'));

        // todo what's the deal with idx:false

        const res2 = await this.#client.callGetMethod(contractAddr, "get_wallet_address", [["tvm.Slice", beginCell().storeAddress(params.owner).endCell().toBoc({ idx: false }).toString("base64")]]);
        const ownerJWalletAddr = (parseGetMethodCall(res2.stack)[0] as Cell).beginParse().readAddress()!;

        params.onProgress?.(JettonDeployState.AWAITING_MINTER_DEPLOY);
        await waitForContractDeploy(ownerJWalletAddr, this.#client);

        params.onProgress?.(JettonDeployState.VERIFY_MINT, undefined, contractAddr.toFriendly()); // TODO better way of emitting the contract?

        const res3 = await this.#client.callGetMethod(ownerJWalletAddr, "get_wallet_data");
        if (!(parseGetMethodCall(res3.stack)[0] as BN).eq(params.amountToMint)) throw new Error("Mint fail");
        params.onProgress?.(JettonDeployState.DONE);
    }

    async getJettonDetails(contractAddr: Address, owner:Address) {
        const res = await this.#client.callGetMethod(
            contractAddr,
            "get_jetton_data"
        );

        const contentCell = (parseGetMethodCall(res.stack)[3] as Cell).beginParse();
        contentCell.readInt(8);
        const jsonURI = contentCell.readRemainingBytes().toString("ascii");
        const jsonData = (await axios.get(jsonURI)).data;

        const res2 = await this.#client.callGetMethod(contractAddr, "get_wallet_address", [["tvm.Slice", beginCell().storeAddress(owner).endCell().toBoc({ idx: false }).toString("base64")]]);
        const ownerJWalletAddr = (parseGetMethodCall(res2.stack)[0] as Cell).beginParse().readAddress()!;

        const res3 = await this.#client.callGetMethod(ownerJWalletAddr, "get_wallet_data");

        return {
            jetton: {...jsonData, contractAddress: contractAddr.toFriendly()},
            wallet: {
                jettonAmount: (parseGetMethodCall(res3.stack)[0] as BN).toString(),
                ownerJWallet: ownerJWalletAddr.toFriendly(),
                owner: owner.toFriendly()
            }
        };

        // let cell = new Cell();
        // cell.bits.writeAddress(params.owner);
        // // nodejs buffer
        // let b64dataBuffer = (await cell.toBoc({ idx: false })).toString("base64");
        // console.log(b64dataBuffer)


        // console.log(beginCell().storeAddress(params.owner).endCell().toBoc({ idx: false }).toString('base64'));

        // todo what's the deal with idx:false
        
    }
}

// TODO extract util
function parseGetMethodCall(stack: any[]) {
    return stack.map(([type, val]) => {
        switch (type) {
            case "num":
                return new BN(val.replace("0x", ""), "hex");
            case "cell":
                return Cell.fromBoc(Buffer.from(val.bytes, "base64"))[0];
            default:
                throw new Error("unknown type");
        }
    });
}

enum OPS {
    Mint = 21,
    InternalTransfer = 0x178d4519,
    Transfer = 0xf8a7ea5
}

class JettonMinter {
    static initData(owner: Address, contentUri: string) {
        return beginCell()
            .storeCoins(0)
            .storeAddress(owner)
            .storeRef(
                beginCell()
                    .storeInt(1, 8) // off-chain marker (https://github.com/ton-blockchain/TIPs/issues/64)
                    .storeBuffer(Buffer.from(contentUri, "ascii"))
                    .endCell()
            )
            .storeRef(Cell.fromBoc(walletCode)[0])
            .endCell();
    }

    static mintBody(owner: Address, jettonValue: BN): Cell {
        return beginCell()
            .storeUint(OPS.Mint, 32) // opcode (reference TODO)
            .storeUint(0, 64) // queryid
            .storeAddress(owner)
            .storeCoins(toNano(0.2)) // gas fee
            .storeRef( // internal transfer message
                beginCell()
                    .storeUint(OPS.InternalTransfer, 32)
                    .storeUint(0, 64)
                    .storeCoins(jettonValue)
                    .storeAddress(null) // TODO FROM?
                    .storeAddress(null) // TODO RESP?
                    .storeCoins(0)
                    .storeBit(false) // forward_payload in this slice, not separate cell
                    .endCell()
            )
            .endCell();
    }
}