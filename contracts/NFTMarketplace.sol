// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev A decentralized marketplace for buying and selling NFTs
 * @author Rishabh Sharma
 * @notice This contract allows users to create, list, and trade NFTs with a listing fee
 */
contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _tokenIds;
    uint256 private _itemsSold;
    uint256 public listPrice = 0.01 ether; // Fee to list an NFT

    /**
     * @dev Struct to represent a listed NFT in the marketplace
     */
    struct ListedToken {
        uint256 tokenId;           // Unique token identifier
        address payable owner;     // Current owner (marketplace contract when listed)
        address payable seller;    // Address that receives payment
        uint256 price;            // Sale price in wei
        bool currentlyListed;     // Whether NFT is in marketplace escrow
        bool forSale;            // Whether NFT is available for purchase
    }

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed seller,
        uint256 price,
        bool currentlyListed,
        bool forSale
    );

    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    mapping(uint256 => ListedToken) private idToListedToken;

    /**
     * @dev Initialize the NFT marketplace
     */
    constructor() ERC721("NFTMarketplace", "NFTM") {}

    /**
     * @dev Update the listing price (only owner)
     * @param _listPrice New listing price in wei
     */
    function updateListPrice(uint256 _listPrice) public onlyOwner {
        listPrice = _listPrice;
    }

    /**
     * @dev Get the current listing price
     * @return Current listing price in wei
     */

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds;
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Get total number of items sold
     * @return Number of NFTs sold through the marketplace
     */
    function getTotalItemsSold() public view returns (uint256) {
        return _itemsSold;
    }

    function createToken(string memory tokenURI, uint256 price) public payable returns (uint256) {
        require(msg.value == listPrice, "Must pay listing fee");
        require(price > 0, "Price must be greater than 0");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        createListedToken(newTokenId, price);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true,
            true
        );

        _transfer(msg.sender, address(this), tokenId);
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true,
            true
        );
    }

    function toggleForSale(uint256 tokenId) public {
        require(idToListedToken[tokenId].seller == msg.sender, "Only the seller can toggle the sale status");
        idToListedToken[tokenId].forSale = !idToListedToken[tokenId].forSale;

        emit TokenListedSuccess(
            tokenId,
            idToListedToken[tokenId].owner,
            idToListedToken[tokenId].seller,
            idToListedToken[tokenId].price,
            idToListedToken[tokenId].currentlyListed,
            idToListedToken[tokenId].forSale
        );
    }

    // New function: Allow NFT owner to re-list their NFT for sale
    function resellToken(uint256 tokenId, uint256 price) public payable {
        require(ownerOf(tokenId) == msg.sender, "You must own the NFT to list it");
        require(msg.value == listPrice, "Must pay listing fee");
        require(price > 0, "Price must be greater than 0");
        require(idToListedToken[tokenId].currentlyListed == false, "NFT is already listed");

        // Create new listing
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true,
            true
        );

        // Transfer NFT to marketplace for escrow
        _transfer(msg.sender, address(this), tokenId);
        
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true,
            true
        );
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds;
        uint256 actualCount = 0;
        
        // First pass: count existing NFTs (some might be deleted after sale)
        for(uint256 i = 1; i <= nftCount; i++) {
            // Check if NFT exists by checking if it has an owner
            try this.ownerOf(i) returns (address) {
                actualCount++;
            } catch {
                // NFT doesn't exist, skip
            }
        }
        
        ListedToken[] memory tokens = new ListedToken[](actualCount);
        uint256 currentIndex = 0;
        
        for(uint256 i = 1; i <= nftCount; i++) {
            try this.ownerOf(i) returns (address nftOwner) {
                if(idToListedToken[i].currentlyListed) {
                    // NFT is currently listed
                    tokens[currentIndex] = idToListedToken[i];
                } else {
                    // NFT exists but not listed - create representation
                    tokens[currentIndex] = ListedToken(
                        i,
                        payable(nftOwner),      // Actual owner
                        payable(nftOwner),      // Would be seller if they list
                        0,                      // No price (not for sale)
                        false,                  // Not listed
                        false                   // Not for sale
                    );
                }
                currentIndex++;
            } catch {
                // NFT doesn't exist, skip
            }
        }
        return tokens;
    }

    function getListedNFTs() public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        
        // Count items for sale
        for(uint256 i = 1; i <= totalItemCount; i++) {
            if(idToListedToken[i].forSale && idToListedToken[i].currentlyListed) {
                itemCount++;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        uint256 currentIndex = 0;
        
        for(uint256 i = 1; i <= totalItemCount; i++) {
            if(idToListedToken[i].forSale && idToListedToken[i].currentlyListed) {
                ListedToken storage currentItem = idToListedToken[i];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return items;
    }

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        
        // Count user's items - check both listed items and actual NFT ownership
        for(uint256 i = 1; i <= totalItemCount; i++) {
            // Check if user is seller of a listed item OR actual owner of the NFT
            bool isListed = idToListedToken[i].seller == msg.sender;
            bool isOwner = ownerOf(i) == msg.sender;
            
            if(isListed || isOwner) {
                itemCount++;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        uint256 currentIndex = 0;
        
        for(uint256 i = 1; i <= totalItemCount; i++) {
            bool isListed = idToListedToken[i].seller == msg.sender;
            bool isOwner = ownerOf(i) == msg.sender;
            
            if(isListed || isOwner) {
                if(isListed) {
                    // NFT is currently listed by this user
                    ListedToken storage currentItem = idToListedToken[i];
                    items[currentIndex] = currentItem;
                } else {
                    // NFT is owned by user but not listed - create a temporary struct
                    items[currentIndex] = ListedToken(
                        i,
                        payable(msg.sender),    // User owns it
                        payable(msg.sender),    // User would be seller if they list it
                        0,                      // No price set (not for sale)
                        false,                  // Not currently listed
                        false                   // Not for sale
                    );
                }
                currentIndex++;
            }
        }
        return items;
    }

    function executeSale(uint256 tokenId) public payable nonReentrant {
        uint256 price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        
        require(msg.value == price, "Please submit the asking price to complete the purchase");
        require(idToListedToken[tokenId].forSale, "This NFT is not for sale");
        require(idToListedToken[tokenId].currentlyListed, "This NFT is not currently listed");

        // Clear the listing data since NFT is sold and no longer in marketplace
        delete idToListedToken[tokenId];
        _itemsSold++;

        // Transfer the NFT to buyer
        _transfer(address(this), msg.sender, tokenId);
        
        // Transfer full sale amount to seller (listing fee was already paid during listing)
        payable(seller).transfer(msg.value);

        emit TokenSold(tokenId, seller, msg.sender, price);
    }
}
