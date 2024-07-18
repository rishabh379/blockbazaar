import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from "ethers";

export default function NFTPage(props) {
    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");

    async function getNFTData(tokenId) {
        try {
            // Initialize provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const addr = await signer.getAddress();
            
            // Get contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            // Get token URI and listed token details
            var tokenURI = await contract.tokenURI(tokenId);
            const listedToken = await contract.getListedTokenForId(tokenId);
            tokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            // Prepare item details
            let item = {
                price: meta.price,
                tokenId: tokenId,
                seller: listedToken.seller,
                owner: listedToken.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            };

            updateData(item);
            updateDataFetched(true);
            updateCurrAddress(addr);
        } catch (e) {
            console.error(e);
            updateMessage("Error fetching NFT data.");
        }
    }

    async function buyNFT(tokenId) {
        try {
            const ethers = require("ethers");
            // After adding your Hardhat network to your Metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether');
            
            // Check balance
            const balance = await provider.getBalance(await signer.getAddress());
            if (balance.lt(salePrice)) {
                throw new Error("Insufficient funds to complete the transaction.");
            }

            // Estimate gas limit (optional)
            const gasLimit = await contract.estimateGas.executeSale(tokenId, { value: salePrice });

            // Execute sale
            updateMessage("Buying the NFT... Please Wait (Up to 5 mins)");
            let transaction = await contract.executeSale(tokenId, {
                value: salePrice,
                gasLimit: gasLimit.toString() // Optionally you can set a fixed gas limit
            });
            await transaction.wait();

            alert('You successfully bought the NFT!');
            updateMessage("");
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }

    const params = useParams();
    const tokenId = params.tokenId;

    useEffect(() => {
        if (!dataFetched) {
            getNFTData(tokenId);
        }
    }, [dataFetched, tokenId]);

    if (typeof data.image === "string") {
        data.image = GetIpfsUrlFromPinata(data.image);
    }

    return (
        <div style={{ "min-height": "100vh" }}>
            <Navbar />
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-black shadow-2xl rounded-lg border-2 p-5">
                    <div>Name: {data.name}</div>
                    <div>Description: {data.description}</div>
                    <div>Price: <span>{data.price + " ETH"}</span></div>
                    <div>Owner: <span className="text-sm">{data.owner}</span></div>
                    <div>Seller: <span className="text-sm">{data.seller}</span></div>
                    <div>
                        {currAddress !== data.owner && currAddress !== data.seller ? (
                            <button 
                                className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                onClick={() => buyNFT(tokenId)}
                            >
                                Buy this NFT
                            </button>
                        ) : (
                            <div className="text-emerald-700">You are the owner of this NFT</div>
                        )}
                        <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
