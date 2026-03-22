import { useMemo, useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";

const PACKAGE_ID =
  "0x561eacdc77daf0126be71a33b817fc431ceebf14eac7de439d270546b575a86a";

function ipfsToGateway(url: string) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${url.replace("ipfs://", "")}`;
  }
  return url;
}

export default function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState("Ready");
  const [imageUrl, setImageUrl] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [txDigest, setTxDigest] = useState("");

  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : "";
  }, [file]);

  async function uploadImageToIpfs() {
    if (!file) throw new Error("No file selected");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Image upload failed");
    }

    return data.url as string;
  }

  async function uploadMetadataToIpfs(
    uploadedImageUrl: string,
    nftName: string,
    nftDescription: string
  ) {
    const res = await fetch("/api/upload-json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nftName,
        description: nftDescription,
        image: uploadedImageUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Metadata upload failed");
    }

    return data.url as string;
  }

  async function handleUploadAndMint() {
    try {
      if (!account) {
        setStatus("Connect wallet first");
        return;
      }

      if (!name.trim()) {
        setStatus("Enter NFT name");
        return;
      }

      if (!description.trim()) {
        setStatus("Enter description");
        return;
      }

      if (!file) {
        setStatus("Choose image file");
        return;
      }

      setStatus("Uploading image to IPFS...");
      setTxDigest("");

      const uploadedImageUrl = await uploadImageToIpfs();
      setImageUrl(uploadedImageUrl);

      setStatus("Uploading metadata to IPFS...");
      const uploadedMetadataUrl = await uploadMetadataToIpfs(
        uploadedImageUrl,
        name.trim(),
        description.trim()
      );
      setMetadataUrl(uploadedMetadataUrl);

      setStatus("Waiting for wallet approval...");

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::kryptonite_nft::mint_to_sender`,
        arguments: [
          tx.pure.string(name.trim()),
          tx.pure.string(description.trim()),
          tx.pure.string(uploadedImageUrl),
          tx.pure.string(uploadedMetadataUrl),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setTxDigest(result.digest);
            setStatus("NFT minted successfully");
          },
          onError: (error) => {
            console.error(error);
            setStatus(error.message || "Mint failed");
          },
        }
      );
    } catch (error: any) {
      console.error(error);
      setStatus(error.message || "Upload + mint failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>
          IOTA NFT Minter 🚀
        </h1>

        <div style={{ marginBottom: 20 }}>
          <ConnectButton />
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <input
            type="text"
            placeholder="NFT Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <div style={{ marginBottom: 16 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {previewUrl ? (
            <div style={{ marginBottom: 20 }}>
              <img
                src={previewUrl}
                alt="preview"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  display: "block",
                  objectFit: "cover",
                  maxHeight: 420,
                }}
              />
            </div>
          ) : null}

          <button
            onClick={handleUploadAndMint}
            style={{
              width: "100%",
              padding: 14,
              border: "none",
              borderRadius: 10,
              background: "green",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            Upload + Mint NFT
          </button>

          <div style={{ marginTop: 18, lineHeight: 1.8, wordBreak: "break-all" }}>
            <div>{status}</div>

            {account?.address ? (
              <div>
                <strong>Wallet:</strong> {account.address}
              </div>
            ) : null}

            {imageUrl ? (
              <div>
                <strong>Image:</strong>{" "}
                <a href={ipfsToGateway(imageUrl)} target="_blank" rel="noreferrer">
                  {ipfsToGateway(imageUrl)}
                </a>
              </div>
            ) : null}

            {metadataUrl ? (
              <div>
                <strong>Metadata:</strong>{" "}
                <a href={ipfsToGateway(metadataUrl)} target="_blank" rel="noreferrer">
                  {ipfsToGateway(metadataUrl)}
                </a>
              </div>
            ) : null}

            {txDigest ? (
              <div>
                <strong>Tx:</strong>{" "}
                <a
                  href={`https://iotascan.com/mainnet/tx/${txDigest}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txDigest}
                </a>
              </div>
            ) : null}

            <div>
              <strong>Package:</strong>{" "}
              <a
                href={`https://iotascan.com/mainnet/object/${PACKAGE_ID}`}
                target="_blank"
                rel="noreferrer"
              >
                {PACKAGE_ID}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  fontSize: 16,
  marginBottom: 16,
  borderRadius: 10,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  boxSizing: "border-box",
};
