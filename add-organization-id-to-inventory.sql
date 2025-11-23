-- Add organization_id column to inventory table
ALTER TABLE public.inventory 
ADD COLUMN organization_id uuid;

-- Update existing records to set organization_id from their linked pricing plan
UPDATE public.inventory
SET organization_id = pricingplan.organization_id
FROM public.pricingplan
WHERE inventory.pricing_plan_id = pricingplan.id;

-- Make organization_id NOT NULL after updating existing records
ALTER TABLE public.inventory 
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.inventory
ADD CONSTRAINT fk_organization_id 
FOREIGN KEY (organization_id) 
REFERENCES public.organizations(id) 
ON UPDATE CASCADE 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_inventory_organization_id ON public.inventory(organization_id);

-- Add comment
COMMENT ON COLUMN public.inventory.organization_id IS 'Organization that owns this inventory item';
