const solanaWeb3 = require("@solana/web3.js");
const axios = require("axios"); // For HTTP requests (not used in this snippet)
const uuid = require("uuid"); // For generating UUIDs

// Address to search for transactions
const searchAddress = "4UYjrT5hmMTh9pLFg1Mxh49besnAeCc23qFoZc6WnQkK";

// Solana Mainnet RPC endpoint with API key
const endpoint =
  "https://solana-mainnet.api.syndica.io/api-key/2Ex2kzrDAqwtjcbFLNXKRzaFyYYXs5pgwrsWNbMhT7FofjVqEBCwU79hbMACM4NE9NR4GCjEbS8x3qKi4XEPe6VGC3vbZrHmZTZ";

// Create a new connection instance with the specified endpoint
const solanaConnection = new solanaWeb3.Connection(endpoint);

// Function to fetch and display transactions for a given address
const getTransactions = async (address, numTx) => {
  try {
    // Create a PublicKey object from the provided address
    const pubKey = new solanaWeb3.PublicKey(address);

    // Fetch transaction signatures for the given address
    let transactionList = await solanaConnection.getSignaturesForAddress(
      pubKey,
      { limit: numTx }
    );

    // Fetch detailed information for each transaction signature
    const transactions = await Promise.all(
      transactionList.map(async (transaction) => {
        try {
          // Fetch the full transaction details
          const txDetails = await solanaConnection.getTransaction(
            transaction.signature
          );

          // Convert block time to a human-readable date
          const date = new Date(transaction.blockTime * 1000);

          // Extract relevant information from transaction details
          return {
            uuid: uuid.v4(), // Generate a unique identifier for the transaction
            network: "Solana",
            fee: txDetails.meta?.fee || 0, // Transaction fee
            compute_units_consumed: txDetails.meta?.computeUnits || 0, // Compute units used
            timestamp: date.toISOString(), // ISO format date string
            type:
              txDetails.meta?.preBalances && txDetails.meta?.postBalances
                ? "send_token" // Determine the type of transaction
                : "receive_token",
            wallet_address: address, // The wallet address for which transactions are being retrieved
            transaction_hash: transaction.signature, // Transaction signature (hash)
            metadata: {
              amount: txDetails.meta?.preBalances
                ? (
                    txDetails.meta.preBalances[0] - // Pre-transaction balance
                    txDetails.meta.postBalances[0]
                  ) // Post-transaction balance
                    .toString()
                : "0", // Default amount if no balance information is available
            },
            token: {
              uuid: uuid.v4(), // Dummy UUID for the token
              network: "Solana",
              contract_address: "So11111111111111111111111111111111111111112", // Example contract address
              name: "Wrapped SOL", // Example token name
              symbol: "SOL", // Example token symbol
              decimals: 9, // Number of decimal places
              display_decimals: 2, // Decimal places for display
              logo_url:
                "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", // Example logo URL
            },
            explorer_url: `https://solscan.io/tx/${transaction.signature}?cluster=mainnet-beta`, // URL to view the transaction on Solscan
          };
        } catch (error) {
          // Handle any errors that occur while fetching transaction details
          console.error(
            `Failed to fetch details for transaction ${transaction.signature}:`,
            error
          );
          return null; // Return null if there's an error
        }
      })
    );

    // Filter out any null results from the transactions array
    const filteredTransactions = transactions.filter((tx) => tx !== null);

    // Output the results in JSON format
    console.log(
      JSON.stringify(
        {
          status: "success",
          message: "Activity retrieved successfully",
          data: filteredTransactions,
        },
        null,
        2
      )
    );
  } catch (error) {
    // Handle any errors that occur during the transaction fetching process
    console.error("Failed to fetch transactions:", error);
  }
};

// Call the function to get transactions for the given address (limit to 1 transaction)
getTransactions(searchAddress, 1);
