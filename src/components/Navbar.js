import logo from '../logo.png';
import fullLogo from '../full_logo.png';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

function Navbar() {

const [connected, toggleConnect] = useState(false);
const location = useLocation();
const [currAddress, updateAddress] = useState('0x');

async function getAddress() {
  const ethers = require("ethers");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const addr = await signer.getAddress();
  updateAddress(addr);
}

function updateButton() {
  const ethereumButton = document.querySelector('.enableEthereumButton');
  ethereumButton.textContent = "Connected";
  ethereumButton.classList.remove("hover:bg-blue-70");
  ethereumButton.classList.remove("bg-blue-500");
  ethereumButton.classList.add("hover:bg-green-70");
  ethereumButton.classList.add("bg-green-500");
}

async function connectWebsite() {

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if(chainId !== '0x5')
    {
      //alert('Incorrect network! Switch your metamask network to Rinkeby');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }],
     })
    }  
    await window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(() => {
        updateButton();
        console.log("here");
        getAddress();
        window.location.replace(location.pathname)
      });
}

  useEffect(() => {
    if(window.ethereum == undefined)
      return;
    let val = window.ethereum.isConnected();
    if(val)
    {
      console.log("here");
      getAddress();
      toggleConnect(val);
      updateButton();
    }

    window.ethereum.on('accountsChanged', function(accounts){
      window.location.replace(location.pathname)
    })
  });

  return (
    <div className="">
      <nav className="w-screen bg-black shadow-lg"> {/* Added shadow and padding */}
        <ul className='flex items-center justify-between py-2 text-white pr-5'>
          <li className='flex items-center ml-5 pb-2'>
            <Link to="/" className="flex items-center">
              <img src={fullLogo} alt="" width={32} height={32} className="flex items-center"/>
              <div className='inline-block font-bold text-2xl ml-2'>
                BlockBazaar
              </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-semibold mr-10 text-lg'>
              {location.pathname === "/" ? 
              <li className='border-b-2 border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/" className="hover:text-gray-300">Marketplace</Link> {/* Added hover text color */}
              </li>
              :
              <li className='hover:border-b-2 hover:border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/" className="hover:text-gray-300">Marketplace</Link> {/* Added hover text color */}
              </li>              
              }
              {location.pathname === "/sellNFT" ? 
              <li className='border-b-2 border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/sellNFT" className="hover:text-gray-300">List My NFT</Link> {/* Added hover text color */}
              </li>
              :
              <li className='hover:border-b-2 hover:border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/sellNFT" className="hover:text-gray-300">List My NFT</Link> {/* Added hover text color */}
              </li>              
              }              
              {location.pathname === "/profile" ? 
              <li className='border-b-2 border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/profile" className="hover:text-gray-300">Profile</Link> {/* Added hover text color */}
              </li>
              :
              <li className='hover:border-b-2 hover:border-white hover:pb-0 p-2 transition duration-300 ease-in-out'>
                <Link to="/profile" className="hover:text-gray-300">Profile</Link> {/* Added hover text color */}
              </li>              
              }  
              <li className="ml-4">
                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full text-sm transition duration-300 ease-in-out shadow-md" onClick={connectWebsite}>{connected? "Connected":"Connect Wallet"}</button> {/* Added more padding, rounded full and shadow */}
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div className='text-black font-bold text-right mr-10 text-sm mt-2'>
        {currAddress !== "0x" ? "Connected to":"Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0,15)+'...'):""}
      </div>
    </div>
  );
  
  }

  export default Navbar;