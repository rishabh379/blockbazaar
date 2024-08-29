import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from "ethers";

export default function NFTPage() {
    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");

    // New state variables for additional features
    const [listingType, setListingType] = useState("direct");
    const [fractionCount, setFractionCount] = useState(2);
    const [pricePerFraction, setPricePerFraction] = useState("");
    const [auctionTime, setAuctionTime] = useState(24);
    const [buyFractionCount, setBuyFractionCount] = useState(1);
    const [bidAmount, setBidAmount] = useState("");

    const params = useParams();
    const tokenId = params.tokenId;

    async function getNFTData(tokenId) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const addr = await signer.getAddress();
            
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            const tokenURI = await contract.tokenURI(tokenId);
            const listedToken = await contract.getListedTokenForId(tokenId);
            const formattedTokenURI = GetIpfsUrlFromPinata(tokenURI);
            let meta = await axios.get(formattedTokenURI);
            meta = meta.data;

            let item = {
                price: meta.price,
                tokenId: tokenId,
                seller: listedToken.seller,
                owner: listedToken.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
                forSale: listedToken.forSale
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
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether');
            
            const balance = await provider.getBalance(await signer.getAddress());
            if (balance.lt(salePrice)) {
                throw new Error("Insufficient funds to complete the transaction.");
            }

            updateMessage("Buying the NFT... Please Wait (Up to 5 mins)");
            let transaction = await contract.executeSale(tokenId, { value: salePrice });
            await transaction.wait();

            alert('You successfully bought the NFT!');
            updateMessage("");
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }

    async function toggleForSale(tokenId) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            updateMessage("Toggling sale status... Please Wait");
            let transaction = await contract.toggleForSale(tokenId);
            await transaction.wait();

            alert('Sale status updated successfully!');
            updateMessage("");
            getNFTData(tokenId);  // Refresh the NFT data
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }

    // New functions for additional features
    const handleListingTypeChange = (e) => {
        setListingType(e.target.value);
    };

    const handleListNFT = () => {
        let message = "";
        if (listingType === "direct") {
            message = "NFT listed for direct sale";
        } else if (listingType === "fractional") {
            message = `NFT fractioned into ${fractionCount} parts at ${pricePerFraction} ETH per fraction`;
        } else if (listingType === "auction") {
            message = `NFT put up for auction lasting ${auctionTime} hours`;
        }
        alert(message);
        // After successful listing, you might want to call toggleForSale(tokenId)
    };

    const handleBuyFractions = () => {
        alert(`Buying ${buyFractionCount} fractions of the NFT`);
        // Here you would typically interact with the smart contract to buy fractions
    };

    const handlePlaceBid = () => {
        alert(`Placing bid of ${bidAmount} ETH for the NFT`);
        // Here you would typically interact with the smart contract to place a bid
    };

    useEffect(() => {
        if (!dataFetched) {
            getNFTData(tokenId);
        }
    }, [dataFetched, tokenId]);

    if (typeof data.image === "string") {
        data.image = GetIpfsUrlFromPinata(data.image);
    }

    return (
        <div style={{ "minHeight": "100vh" }}>
            <Navbar />
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-black shadow-2xl rounded-lg border-2 p-5">
                    <div>Name: {data.name}</div>
                    <div>Description: {data.description}</div>
                    <div>Price: <span>{data.price + " ETH"}</span></div>
                    <div>Owner: <span className="text-sm">{data.owner}</span></div>
                    <div>Seller: <span className="text-sm">{data.seller}</span></div>
                    <div>For Sale: <span>{data.forSale ? "Yes" : "No"}</span></div>
                    <div>
                        {currAddress === data.seller ? (
                            <div>
                                <button 
                                    className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm mr-2"
                                    onClick={() => toggleForSale(tokenId)}
                                >
                                    {data.forSale ? "Remove from Sale" : "Put on Sale"}
                                </button>
                                
                                {!data.forSale && (
                                    <div className="mt-4">
                                        <select value={listingType} onChange={handleListingTypeChange} className="mb-4">
                                            <option value="direct">Direct Listing</option>
                                            <option value="fractional">Fractional Listing</option>
                                            <option value="auction">Auction</option>
                                        </select>
                                        {listingType === "fractional" && (
                                            <div>
                                                <input 
                                                    type="number" 
                                                    value={fractionCount} 
                                                    onChange={(e) => setFractionCount(e.target.value)} 
                                                    placeholder="Number of fractions"
                                                    className="mb-2 w-full p-2 border rounded"
                                                />
                                                <input 
                                                    type="number" 
                                                    value={pricePerFraction} 
                                                    onChange={(e) => setPricePerFraction(e.target.value)} 
                                                    placeholder="Price per fraction (ETH)"
                                                    className="mb-2 w-full p-2 border rounded"
                                                />
                                            </div>
                                        )}
                                        {listingType === "auction" && (
                                            <input 
                                                type="number" 
                                                value={auctionTime} 
                                                onChange={(e) => setAuctionTime(e.target.value)} 
                                                placeholder="Auction duration (hours)"
                                                className="mb-2 w-full p-2 border rounded"
                                            />
                                        )}
                                        <button 
                                            className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                                            onClick={handleListNFT}
                                        >
                                            List NFT
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : currAddress !== data.owner && data.forSale ? (
                            <div>
                                <button 
                                    className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm mb-2"
                                    onClick={() => buyNFT(tokenId)}
                                >
                                    Buy this NFT
                                </button>
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        value={buyFractionCount} 
                                        onChange={(e) => setBuyFractionCount(e.target.value)} 
                                        placeholder="Number of parts to buy"
                                        className="mb-2 w-full p-2 border rounded"
                                    />
                                    <button 
                                        className="enableEthereumButton bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
                                        onClick={handleBuyFractions}
                                    >
                                        Buy Parts
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        value={bidAmount} 
                                        onChange={(e) => setBidAmount(e.target.value)} 
                                        placeholder="Bid amount (ETH)"
                                        className="mb-2 w-full p-2 border rounded"
                                    />
                                    <button 
                                        className="enableEthereumButton bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm"
                                        onClick={handlePlaceBid}
                                    >
                                        Place Bid
                                    </button>
                                </div>
                            </div>
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