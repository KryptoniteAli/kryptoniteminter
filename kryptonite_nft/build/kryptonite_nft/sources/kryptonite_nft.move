module kryptonite_nft::kryptonite_nft {

    use std::string::{String, utf8};

    use iota::display;
    use iota::object::{Self, UID};
    use iota::package;
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

    public struct KRYPTONITE_NFT has drop {}

    fun init(otw: KRYPTONITE_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        let keys = vector[
            utf8(b"name"),
            utf8(b"description"),
            utf8(b"image_url"),
            utf8(b"project_url"),
            utf8(b"creator"),
        ];

        let values = vector[
            utf8(b"{name}"),
            utf8(b"{description}"),
            utf8(b"{image_url}"),
            utf8(b"https://kryptoniteminter.vercel.app"),
            utf8(b"{creator}"),
        ];

        let mut disp = display::new_with_fields<NFT>(&publisher, keys, values, ctx);
        display::update_version(&mut disp);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(disp, tx_context::sender(ctx));
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
