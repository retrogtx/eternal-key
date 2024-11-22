import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQ = () => {
  return (
    <div className="mt-16 max-w-2xl mx-auto text-left">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="item-1" className="border-none bg-zinc-900/50 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline text-white py-4">
            How does Eternal Key work?
          </AccordionTrigger>
          <AccordionContent className="text-zinc-400 pb-4">
            Eternal Key uses smart contracts on the Solana blockchain to create a secure, automated inheritance system. 
            You first set up an escrow which stores your assets, and specify the transfer amount along with a time period.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-none bg-zinc-900/50 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline text-white py-4">
            What happens to my assets?
          </AccordionTrigger>
          <AccordionContent className="text-zinc-400 pb-4">
            Your assets remain securely locked in the smart contract until either you miss a check-in deadline or you choose to cancel the escrow and withdraw them. 
            You maintain full control over your assets while the switch is active. Once the time is up, only the beneficiary wallet can withdraw the assets.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-none bg-zinc-900/50 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline text-white py-4">
            Is this secure?
          </AccordionTrigger>
          <AccordionContent className="text-zinc-400 pb-4">
            Yes, alot. Eternal Key is built on Solana&apos;s blockchain, ensuring maximum security and transparency. 
            All transactions and rules are enforced by smart contracts, making the process completely trustless and automated.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border-none bg-zinc-900/50 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline text-white py-4">
            How do I verify this so I can trust it?
          </AccordionTrigger>
          <AccordionContent className="text-zinc-400 pb-4">
            You can verify the code and smart contract by checking the source code on <a href="https://github.com/amritwt/eternal-key" className="underline">Github</a>.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}; 