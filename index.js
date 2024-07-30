const solanaWeb3 = require("@solana/web3.js");
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

    // Track used signatures to identify duplicates
    const seenSignatures = new Set();

    // Fetch detailed information for each transaction signature
    const transactions = await Promise.all(
      transactionList.map(async (transaction) => {
        try {
          // Check for duplicate signatures
          if (seenSignatures.has(transaction.signature)) {
            console.log(`Duplicate signature found: ${transaction.signature}`);
            return null; // Skip processing duplicate signatures
          } else {
            seenSignatures.add(transaction.signature);
          }

          // Fetch the full transaction details
          const txDetails = await solanaConnection.getTransaction(
            transaction.signature
          );

          // Check if txDetails is defined
          if (!txDetails) {
            console.error(
              `No details found for transaction: ${transaction.signature}`
            );
            return null;
          }

          // Convert block time to a human-readable date
          const date = new Date(transaction.blockTime * 1000);

          // Determine if the transaction is a send, receive, or swap operation
          let type = "unknown";
          if (
            txDetails.meta?.preTokenBalances &&
            txDetails.meta?.postTokenBalances &&
            txDetails.meta.preTokenBalances.length > 0 &&
            txDetails.meta.postTokenBalances.length > 0
          ) {
            type = "swap";
          } else if (
            txDetails.meta?.preBalances &&
            txDetails.meta?.postBalances &&
            txDetails.meta.preBalances.length > 0 &&
            txDetails.meta.postBalances.length > 0
          ) {
            type = "send_token";
          } else if (
            txDetails.meta?.preBalances &&
            txDetails.meta.preBalances.length > 0
          ) {
            type = "receive_token";
          }

          // Calculate the amount in the token's units (e.g., SOL from lamports)
          let amount = 0;
          if (type === "send_token") {
            amount =
              (txDetails.meta.preBalances[0] - txDetails.meta.postBalances[0]) /
              Math.pow(10, 9);
          } else if (type === "swap") {
            // Handle swap transactions; this is a simplified example
            amount = txDetails.meta.postTokenBalances.reduce(
              (sum, balance) => sum + (balance.uiTokenAmount?.uiAmount || 0),
              0
            );
          }

          // Extract relevant information from transaction details
          return {
            uuid: uuid.v4(), // Generate a unique identifier for the transaction
            network: "Solana",
            fee: txDetails.meta?.fee || 0, // Transaction fee
            compute_units_consumed: txDetails.meta?.computeUnits || 0, // Compute units used
            timestamp: date.toISOString(), // ISO format date string
            type, // Type of transaction
            wallet_address: address, // The wallet address for which transactions are being retrieved
            transaction_hash: transaction.signature, // Transaction signature (hash)
            metadata: {
              amount: amount.toString(), // Convert amount to a string
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

// Call the function to get transactions for the given address (limit to 2 transactions)
getTransactions(searchAddress, 5);
