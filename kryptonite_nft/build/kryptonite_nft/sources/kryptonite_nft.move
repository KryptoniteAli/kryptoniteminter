module kryptonite_nft::kryptonite_nft {
    use std::string::String;

    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::url::{Self, Url};

    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: Url,
        metadata_url: Url,
        creator: address,
    }

    public entry fun mint_to_sender(
        name: String,
        description: String,
        image_url: String,
        metadata_url: String,
        ctx: &mut TxContext,
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name,
            description,
            image_url: url::new_unsafe_from_bytes(image_url.into_bytes()),
            metadata_url: url::new_unsafe_from_bytes(metadata_url.into_bytes()),
            creator: tx_context::sender(ctx),
        };

        transfer::public_transfer(nft, tx_context::sender(ctx));
    }
}
