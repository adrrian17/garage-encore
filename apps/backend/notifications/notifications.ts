import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import { Subscription } from "encore.dev/pubsub";
import { Resend } from "resend";
import { db } from "../database";
import { type OrderMessage, ordersTopic } from "../orders/orders";
import { orders } from "../schema";
import OrderConfirmationEmail from "./templates/OrderConfirmation.tsx";

const resend = new Resend("re_9TQnfJ9c_B6UggzHgHQW96esSCnnRVgFv");

const _ = new Subscription(ordersTopic, "send-order-confirmation", {
  retryPolicy: {
    maxRetries: 5,
  },
  handler: async (order: OrderMessage) => {
    console.log(`Sending confirmation email for order: ${order.orderId}`);

    try {
      const emailHtml = await render(
        OrderConfirmationEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName || undefined,
          orderId: order.orderId,
          items: order.items,
          total: order.total,
          paymentMethod: order.paymentMethod,
        }),
      );

      const { data: emailData, error } = await resend.emails.send({
        from: "Garage Comics <hola@garagecomics.mx>",
        to: [order.customerEmail],
        subject: "¡Gracias por tu pedido!",
        html: emailHtml,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log("Order confirmation email sent:", emailData?.id);

      await db
        .update(orders)
        .set({ confirmed: true })
        .where(eq(orders.order, order));

      console.log(`Order ${order.orderId} marked as confirmed in database`);
    } catch (error) {
      console.error(
        `Error sending confirmarion email for order ${order.orderId}:`,
        error,
      );

      throw error;
    }
  },
});
