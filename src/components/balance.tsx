import React, { useEffect, useState } from "react";
import axios from "axios";

type AccountStats = {
  balance: string;
  tx_count: string;
  nonce: string;
};

const AccountStats: React.FC = () => {
  const [accountData, setAccountData] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "https://eth-sepolia.blockscout.com/api";
  const ADDRESS = "0x9603B054aDb114B550c5f2898b37A48926d0dAb1";

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}?module=account&action=balance&address=${ADDRESS}`);
        if (response.data && response.data.result) {
          setAccountData({
            balance: response.data.result,
            tx_count: response.data.tx_count || "N/A", // Update based on actual API structure
            nonce: response.data.nonce || "N/A",     // Update based on actual API structure
          });
        } else {
          setError("Failed to fetch account data.");
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (loading) {
    return <div>Loading account data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Account Stats</h2>
      {accountData ? (
        <div>
          <p><strong>Address:</strong> {ADDRESS}</p>
          <p><strong>Balance:</strong> {parseFloat(accountData.balance) / 1e18} ETH</p>
          <p><strong>Transaction Count:</strong> {accountData.tx_count}</p>
          <p><strong>Nonce:</strong> {accountData.nonce}</p>
        </div>
      ) : (
        <p>No account data available.</p>
      )}
    </div>
  );
};

export default AccountStats;
