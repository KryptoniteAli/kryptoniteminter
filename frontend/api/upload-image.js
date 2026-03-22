import FormData from "form-data";
import multer from "multer";
import fetch from "node-fetch";

const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, upload.single("file"));

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return res.status(500).json({ error: "PINATA_JWT missing" });
    }

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await pinataRes.json();

    if (!pinataRes.ok) {
      return res.status(pinataRes.status).json(data);
    }

    const cid = data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return res.status(200).json({ cid, url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Image upload failed" });
  }
}
