import { AppDataSource } from "../config/database";
import { Contact } from "../entities/Contact";

interface IdentifyInput {
  email?: string;
  phoneNumber?: string;
}

const contactRepository = AppDataSource.getRepository(Contact);

async function handleEmailOnly(email: string) {
  const existingContact = await contactRepository.findOne({ where: { email } });
  if (existingContact) {
    console.log("\n****************existing email: ");
    return existingContact;
  }
  const newContact = contactRepository.create({
    email,
    linkPrecedence: "primary",
  });
  const res = await contactRepository.save(newContact);
  console.log("\n\n\n****************saved is: ", res);
  return res;
}

async function handlePhoneNumberOnly(phoneNumber: string) {
  const existingContact = await contactRepository.findOne({
    where: { phoneNumber },
  });
  if (existingContact) {
    return existingContact;
  }
  const newContact = contactRepository.create({
    phoneNumber,
    linkPrecedence: "primary",
  });
  return await contactRepository.save(newContact);
}

async function handleEmailAndPhoneNumber(email: string, phoneNumber: string) {
  const existingEmailContact = await contactRepository.findOne({
    where: { email },
  });
  const existingPhoneContact = await contactRepository.findOne({
    where: { phoneNumber },
  });

  if (existingEmailContact && existingPhoneContact) {
    // if (existingEmailContact.id !== existingPhoneContact.id) {
    //   // Link the contacts if they're different
    //   const secondaryContact =
    //     existingEmailContact.createdAt > existingPhoneContact.createdAt
    //       ? existingEmailContact
    //       : existingPhoneContact;
    //   secondaryContact.linkPrecedence = "secondary";

    //   if (existingEmailContact.linkedId) {
    //     secondaryContact.linkedId = existingEmailContact.linkedId;
    //   } else if (existingPhoneContact.linkedId) {
    //     secondaryContact.linkedId = existingPhoneContact.linkedId;
    //   } else {
    //     secondaryContact.linkedId = Math.min(
    //       existingEmailContact.id,
    //       existingPhoneContact.id
    //     );
    //   }
    //   await contactRepository.save(secondaryContact);
    // Find the primary contacts for both
    const emailPrimaryContact =
      existingEmailContact.linkPrecedence === "primary"
        ? existingEmailContact
        : await contactRepository.findOne({
            where: { id: existingEmailContact.linkedId },
          });

    const phonePrimaryContact =
      existingPhoneContact.linkPrecedence === "primary"
        ? existingPhoneContact
        : await contactRepository.findOne({
            where: { id: existingPhoneContact.linkedId },
          });

    if (
      emailPrimaryContact &&
      phonePrimaryContact &&
      emailPrimaryContact.id !== phonePrimaryContact.id
    ) {
      // Decide which one should be the primary
      const [primaryContact, secondaryContact] =
        emailPrimaryContact.createdAt < phonePrimaryContact.createdAt
          ? [emailPrimaryContact, phonePrimaryContact]
          : [phonePrimaryContact, emailPrimaryContact];

      // Update the secondary contact and all its linked contacts
      await contactRepository.update(
        { id: secondaryContact.id },
        { linkedId: primaryContact.id, linkPrecedence: "secondary" }
      );
      await contactRepository.update(
        { linkedId: secondaryContact.id },
        { linkedId: primaryContact.id }
      );

      // Ensure the existingEmailContact and existingPhoneContact are updated
      if (existingEmailContact.id !== primaryContact.id) {
        existingEmailContact.linkedId = primaryContact.id;
        existingEmailContact.linkPrecedence = "secondary";
      }
      if (existingPhoneContact.id !== primaryContact.id) {
        existingPhoneContact.linkedId = primaryContact.id;
        existingPhoneContact.linkPrecedence = "secondary";
      }

      await contactRepository.save([
        existingEmailContact,
        existingPhoneContact,
      ]);

      return primaryContact;
    }
    return existingEmailContact;
  } else if (existingEmailContact) {
    const newContact = contactRepository.create({
      email,
      phoneNumber,
      linkPrecedence: "secondary",
      linkedId: existingEmailContact.linkedId
        ? existingEmailContact.linkedId
        : existingEmailContact.id,
    });
    return await contactRepository.save(newContact);
  } else if (existingPhoneContact) {
    const newContact = contactRepository.create({
      email,
      phoneNumber,
      linkPrecedence: "secondary",
      linkedId: existingPhoneContact.linkedId
        ? existingPhoneContact.linkedId
        : existingPhoneContact.id,
    });
    return await contactRepository.save(newContact);
  } else {
    const newContact = contactRepository.create({
      email,
      phoneNumber,
      linkPrecedence: "primary",
    });
    return await contactRepository.save(newContact);
  }
}

export const identifyService = async (input: IdentifyInput) => {
  try {
    let contact;

    if (input.email && input.phoneNumber) {
      contact = await handleEmailAndPhoneNumber(input.email, input.phoneNumber);
    } else if (input.email) {
      console.log("caling email only");
      contact = await handleEmailOnly(input.email);
    } else if (input.phoneNumber) {
      contact = await handlePhoneNumberOnly(input.phoneNumber);
    } else {
      throw new Error("Invalid input: must provide email or phoneNumber");
    }

    // Fetch all linked contacts
    const allLinkedContacts = await contactRepository.find({
      where: [
        { id: contact.id },
        { linkedId: contact.id },
        ...(contact.linkedId
          ? [{ id: contact.linkedId }, { linkedId: contact.linkedId }]
          : []),
      ],
    });

    // Prepare the response
    const primaryContact =
      allLinkedContacts.find((c) => c.linkPrecedence === "primary") || contact;
    const emails = [
      ...new Set(allLinkedContacts.map((c) => c.email).filter(Boolean)),
    ];
    const phoneNumbers = [
      ...new Set(allLinkedContacts.map((c) => c.phoneNumber).filter(Boolean)),
    ];
    const secondaryContactIds = allLinkedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails: emails,
        phoneNumbers: phoneNumbers,
        secondaryContactIds: secondaryContactIds,
      },
    };
  } catch (error) {
    console.error("Error in identify service:", error);
    throw error;
  }
};
