import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
      return res.status(500).json({ error: "Missing PINATA_JWT" });
    }

    const { name, description, image } = req.body;

    if (!name || !description || !image) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const metadata = {
      name,
      description,
      image,
      attributes: [
        { trait_type: "Collection", value: "Kryptonite NFT" },
        { trait_type: "Network", value: "IOTA Move" }
      ]
    };

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pinataContent: metadata
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    const cid = data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return res.status(200).json({ cid, url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
