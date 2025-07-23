-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL CHECK (specialty IN ('Plumbing', 'Electrical', 'HVAC', 'General')),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT,
  on_call_hours TEXT,
  property_manager_id UUID NOT NULL REFERENCES public.property_managers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Property managers can view their own vendors" 
ON public.vendors 
FOR SELECT 
USING (property_manager_id IN (
  SELECT property_managers.id
  FROM property_managers
  WHERE property_managers.user_id = auth.uid()
));

CREATE POLICY "Property managers can create their own vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (property_manager_id IN (
  SELECT property_managers.id
  FROM property_managers
  WHERE property_managers.user_id = auth.uid()
));

CREATE POLICY "Property managers can update their own vendors" 
ON public.vendors 
FOR UPDATE 
USING (property_manager_id IN (
  SELECT property_managers.id
  FROM property_managers
  WHERE property_managers.user_id = auth.uid()
));

CREATE POLICY "Property managers can delete their own vendors" 
ON public.vendors 
FOR DELETE 
USING (property_manager_id IN (
  SELECT property_managers.id
  FROM property_managers
  WHERE property_managers.user_id = auth.uid()
));

-- Create trigger for automatic updated_at timestamp updates
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();