<?php

// Procedural sandbox file used to demonstrate `php-modernize` transforming
// code in place. No strict types, no type declarations, verbose conditionals,
// dead code — exactly what the mechanical pass cleans up.

function order_total($items, $taxRate)
{
    $sum = 0;
    foreach ($items as $i) {
        $sum = $sum + $i['price'] * $i['qty'];
    }
    $tax = $sum * $taxRate;
    $total = $sum + $tax;
    return $total;
}

function is_eligible_for_discount($customer)
{
    if ($customer['orders'] > 10) {
        return true;
    } else {
        return false;
    }
}

function describe_status($status)
{
    $label = '';
    switch ($status) {
        case 'paid':
            $label = 'Paid';
            break;
        case 'pending':
            $label = 'Pending';
            break;
        default:
            $label = 'Unknown';
    }
    return $label;
}
