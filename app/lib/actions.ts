'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {

    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };
    // const rawFormData_efficient = Object.fromEntries(formData.entries()); // Alternative approach

    const rawFormDataTypes = Object.fromEntries(
        Object.entries(rawFormData).map(
            ([key, value]) => [key, typeof value]
        )
    )

    console.log(rawFormData);
    console.log(rawFormDataTypes);

    // Validate data 
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into DB using raw SQL
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        return {
            message: 'Database ErrFor: Failed to Create Invoice.',
        };
    }

    // Revalidate the Invoives page a.k.a. check if the data has changed and regenrate static content with latest data
    revalidatePath('/dashboard/invoices');

    // Redirect back to the Invoices page
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
        await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    } catch (error) {
        return {
            message: 'Database ErrFor: Failed to Update Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    // NOTE: This block is to demonstrate the use of the error.tsx file
    // TODO: Comment out before committing
    throw new Error('Failed to Delete Invoice');
    
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        // QUESTION: Why is this non-SQL code in the try...catch() block?
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    } catch (error) {
        return {
            message: 'Database ErrFor: Failed to Create Invoice.',
        };
    }
}