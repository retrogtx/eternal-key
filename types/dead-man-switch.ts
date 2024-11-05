import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export type DeadManSwitch = {
  "version": "0.1.0",
  "name": "dead_man_switch",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deadlineTimestamp",
          "type": "i64"
        },
        {
          "name": "beneficiary",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "checkin",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newDeadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "beneficiary",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancel",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "beneficiary",
            "type": "publicKey"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "lastCheckin",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "seed",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6001,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6002,
      "name": "DeadlineExceeded",
      "msg": "Deadline exceeded"
    },
    {
      "code": 6003,
      "name": "DeadlineNotReached",
      "msg": "Deadline not reached"
    }
  ]
};

export const IDL: DeadManSwitch = {
  version: "0.1.0",
  name: "dead_man_switch",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "deadlineTimestamp",
          type: "i64"
        },
        {
          name: "beneficiary",
          type: "publicKey"
        },
        {
          name: "seed",
          type: "string"
        }
      ]
    },
    {
      name: "deposit",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "checkin",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false
        }
      ],
      args: [
        {
          name: "newDeadline",
          type: "i64"
        }
      ]
    },
    {
      name: "claim",
      accounts: [
        {
          name: "beneficiary",
          isMut: true,
          isSigner: true
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "cancel",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "escrow",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "escrow",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey"
          },
          {
            name: "beneficiary",
            type: "publicKey"
          },
          {
            name: "deadline",
            type: "i64"
          },
          {
            name: "lastCheckin",
            type: "i64"
          },
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "seed",
            type: "string"
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidDeadline",
      msg: "Invalid deadline"
    },
    {
      code: 6001,
      name: "InvalidAmount",
      msg: "Invalid amount"
    },
    {
      code: 6002,
      name: "DeadlineExceeded",
      msg: "Deadline exceeded"
    },
    {
      code: 6003,
      name: "DeadlineNotReached",
      msg: "Deadline not reached"
    }
  ]
};

export interface EscrowAccountData {
  owner: PublicKey;
  beneficiary: PublicKey;
  deadline: BN;
  lastCheckin: BN;
  bump: number;
  seed: string;
}

export interface EscrowInfo {
  pubkey: PublicKey;
  account: EscrowAccountData;
  timeRemaining: string;
  balance: number;
  isOwner: boolean;
}